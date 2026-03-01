import {
	extension as extensionTable,
	extensionVersion,
	extensionVersionFile,
	githubArtifactSource,
	getDatabase
} from '$lib/server/db';
import { Octokit } from 'octokit';
import { getOctokitInstance } from '$lib/server/github';
import { extractResourceFiles, extractPomXml } from '$lib/server/extensions/jar';
import { extractSourceFiles } from '$lib/server/extensions/source';
import { parseKeycloakVersion } from '$lib/server/extensions/pom';
import { and, eq } from 'drizzle-orm';
import type { ArtifactSourceAdapter } from '../types';

export class GithubReleasesArtifactAdapter implements ArtifactSourceAdapter {
	constructor(private readonly githubToken?: string) {}

	private getOctokit(platform: App.Platform): Octokit {
		return this.githubToken
			? new Octokit({ auth: this.githubToken })
			: getOctokitInstance(platform);
	}

	async discoverVersions(extensionId: number, platform: App.Platform): Promise<void> {
		const db = getDatabase(platform);

		const [source] = await db
			.select()
			.from(githubArtifactSource)
			.where(eq(githubArtifactSource.extensionId, extensionId))
			.limit(1);

		if (!source) {
			throw new Error(`No GitHub artifact source configured for extension ${extensionId}`);
		}

		const octokit = this.getOctokit(platform);
		const { data: releases } = await octokit.request('GET /repos/{owner}/{repo}/releases', {
			owner: source.owner,
			repo: source.repo
		});

		for (const release of releases) {
			const [existing] = await db
				.select()
				.from(extensionVersion)
				.where(
					and(
						eq(extensionVersion.extensionId, extensionId),
						eq(extensionVersion.version, release.tag_name)
					)
				)
				.limit(1);

			const asset = release.assets.find((a) => a.name.endsWith('.jar'));
			if (!asset) {
				console.error(`No JAR asset for release ${release.tag_name} of extension ${extensionId}`);
				continue;
			}

			// Check if files already synced
			if (existing) {
				const [fileRow] = await db
					.select({ id: extensionVersionFile.id })
					.from(extensionVersionFile)
					.where(eq(extensionVersionFile.versionId, existing.id))
					.limit(1);
				if (fileRow) continue;
			}

			// Download binary JAR for resource files
			const jarResponse = await fetch(asset.browser_download_url);
			if (!jarResponse.ok) {
				console.error(`Failed to fetch JAR for release ${release.tag_name} of extension ${extensionId}`);
				continue;
			}
			const jarBytes = new Uint8Array(await jarResponse.arrayBuffer());
		const keycloakVersion = parseKeycloakVersion(extractPomXml(jarBytes) ?? '') ?? undefined;

			// Download source zipball from GitHub
			const zipballUrl = `https://github.com/${source.owner}/${source.repo}/archive/refs/tags/${release.tag_name}.zip`;
			const zipResponse = await fetch(zipballUrl);

			const resourceFiles = extractResourceFiles(jarBytes);
			const sourceFiles = zipResponse.ok
				? extractSourceFiles(new Uint8Array(await zipResponse.arrayBuffer()))
				: [];

			const allFiles = [...resourceFiles, ...sourceFiles];

			if (existing) {
				await db
					.update(extensionVersion)
					.set({ keycloakVersion })
					.where(eq(extensionVersion.id, existing.id));

				if (allFiles.length > 0) {
					console.log(`Backfilling files for ${release.tag_name} of extension ${extensionId}`);
					await db.insert(extensionVersionFile).values(
						allFiles.map((f) => ({ versionId: existing.id, path: f.path, content: f.content }))
					);
				}
				continue;
			}

			// New version
			const digestBuffer = await crypto.subtle.digest('SHA-256', jarBytes);
			const digest = Array.from(new Uint8Array(digestBuffer))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');

			console.log(`Found new release ${release.tag_name} for extension ${extensionId}`);

			const [inserted] = await db
				.insert(extensionVersion)
				.values({
					extensionId,
					version: release.tag_name,
					downloadUrl: asset.browser_download_url,
					downloadCount: asset.download_count,
					downloadSize: asset.size,
					digest,
					keycloakVersion,
					releaseNotes: release.body,
					publishedAt: release.published_at ? new Date(release.published_at) : new Date()
				})
				.returning({ id: extensionVersion.id });

			if (allFiles.length > 0) {
				await db.insert(extensionVersionFile).values(
					allFiles.map((f) => ({ versionId: inserted.id, path: f.path, content: f.content }))
				);
			}
		}
	}

	async syncDownloadCounts(extensionId: number, platform: App.Platform): Promise<void> {
		const db = getDatabase(platform);
		const octokit = this.getOctokit(platform);

		const [source] = await db
			.select()
			.from(githubArtifactSource)
			.where(eq(githubArtifactSource.extensionId, extensionId))
			.limit(1);

		if (!source) {
			throw new Error(`No GitHub artifact source configured for extension ${extensionId}`);
		}

		const versions = await db
			.select()
			.from(extensionVersion)
			.where(eq(extensionVersion.extensionId, extensionId));

		let totalDownloads = 0;
		for (const version of versions) {
			const githubRelease = await octokit.request(
				'GET /repos/{owner}/{repo}/releases/tags/{tag}',
				{ owner: source.owner, repo: source.repo, tag: version.version }
			);
			const githubReleaseAsset = githubRelease.data.assets.find(
				(asset) => asset.browser_download_url === version.downloadUrl
			);
			if (githubReleaseAsset) {
				const downloadCount = githubReleaseAsset.download_count;
				await db
					.update(extensionVersion)
					.set({ downloadCount })
					.where(eq(extensionVersion.id, version.id));
				totalDownloads += downloadCount;
			}
		}

		await db
			.update(extensionTable)
			.set({ downloadCount: totalDownloads })
			.where(eq(extensionTable.id, extensionId));
	}
}
