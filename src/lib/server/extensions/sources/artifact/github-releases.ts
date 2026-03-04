import {
	extensionVersion,
	extensionVersionFile,
	githubArtifactSource,
	getDatabase
} from '$lib/server/db';
import { Octokit } from 'octokit';
import { getOctokitInstance } from '$lib/server/github';
import { extractResourceFiles, extractPomXml, MAX_JAR_BYTES, sha256Hex } from '$lib/server/extensions/jar';
import { extractSourceFiles } from '$lib/server/extensions/source';
import { parseKeycloakVersion } from '$lib/server/extensions/pom';
import { and, eq } from 'drizzle-orm';
import type { ArtifactSourceAdapter, NewVersion, VersionDownloadCount } from '../types';

// D1 allows max 100 bound parameters per query. With 3 params per file row
// (versionId, path, content), we can fit at most 33 rows safely.
const FILE_INSERT_CHUNK_SIZE = 30;

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
	return chunks;
}

export class GithubReleasesArtifactAdapter implements ArtifactSourceAdapter {
	constructor(private readonly githubToken?: string) {}

	private getOctokit(platform: App.Platform): Octokit {
		return this.githubToken
			? new Octokit({ auth: this.githubToken })
			: getOctokitInstance(platform);
	}

	async discoverVersions(extensionId: number, platform: App.Platform): Promise<NewVersion[]> {
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

		// Resolve current owner/repo via ID to transparently handle renames/transfers.
		if (source.repoId) {
			try {
				const { data } = await octokit.request('GET /repositories/{repository_id}', {
					repository_id: source.repoId
				});
				const currentOwner = data.owner.login;
				const currentRepo = data.name;
				if (currentOwner !== source.owner || currentRepo !== source.repo) {
					await db
						.update(githubArtifactSource)
						.set({ owner: currentOwner, repo: currentRepo })
						.where(eq(githubArtifactSource.extensionId, extensionId));
					source.owner = currentOwner;
					source.repo = currentRepo;
				}
			} catch {
				// Fall through and attempt sync with stored owner/repo.
			}
		}

		// Fetch all releases across all pages (avoids the default 30-item cap).
		const releases = await octokit.paginate('GET /repos/{owner}/{repo}/releases', {
			owner: source.owner,
			repo: source.repo,
			per_page: 100
		});

		const newVersions: NewVersion[] = [];

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

			// Skip if version already has files synced.
			if (existing) {
				const [fileRow] = await db
					.select({ id: extensionVersionFile.id })
					.from(extensionVersionFile)
					.where(eq(extensionVersionFile.versionId, existing.id))
					.limit(1);
				if (fileRow) continue;
			}

			// Reject suspiciously large JARs before downloading to protect Worker memory.
			if (asset.size > MAX_JAR_BYTES) {
				console.error(
					`JAR for release ${release.tag_name} of extension ${extensionId} exceeds size limit (${asset.size} bytes)`
				);
				continue;
			}

			// Download binary JAR for resource files + keycloak version detection.
			const jarResponse = await fetch(asset.browser_download_url);
			if (!jarResponse.ok) {
				console.error(
					`Failed to fetch JAR for release ${release.tag_name} of extension ${extensionId}`
				);
				continue;
			}
			const jarBytes = new Uint8Array(await jarResponse.arrayBuffer());
			const keycloakVersion = parseKeycloakVersion(extractPomXml(jarBytes) ?? '') ?? undefined;

			// Download source zipball from GitHub.
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
					const rows = allFiles.map((f) => ({ versionId: existing.id, path: f.path, content: f.content }));
					for (const chunk of chunkArray(rows, FILE_INSERT_CHUNK_SIZE)) {
						await db.insert(extensionVersionFile).values(chunk);
					}
				}
				continue;
			}

			// New version - compute digest and insert.
			const digest = await sha256Hex(jarBytes);

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
				const rows = allFiles.map((f) => ({ versionId: inserted.id, path: f.path, content: f.content }));
				for (const chunk of chunkArray(rows, FILE_INSERT_CHUNK_SIZE)) {
					await db.insert(extensionVersionFile).values(chunk);
				}
			}

			newVersions.push({ version: release.tag_name, downloadUrl: asset.browser_download_url, digest });
		}

		return newVersions;
	}

	async fetchDownloadCounts(
		extensionId: number,
		platform: App.Platform
	): Promise<VersionDownloadCount[]> {
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

		// Resolve current owner/repo via ID to transparently handle renames/transfers.
		if (source.repoId) {
			try {
				const { data } = await octokit.request('GET /repositories/{repository_id}', {
					repository_id: source.repoId
				});
				const currentOwner = data.owner.login;
				const currentRepo = data.name;
				if (currentOwner !== source.owner || currentRepo !== source.repo) {
					await db
						.update(githubArtifactSource)
						.set({ owner: currentOwner, repo: currentRepo })
						.where(eq(githubArtifactSource.extensionId, extensionId));
					source.owner = currentOwner;
					source.repo = currentRepo;
				}
			} catch {
				// Fall through and attempt sync with stored owner/repo.
			}
		}

		// Fetch all releases in one paginated call instead of one call per version.
		const releases = await octokit.paginate('GET /repos/{owner}/{repo}/releases', {
			owner: source.owner,
			repo: source.repo,
			per_page: 100
		});

		// Build a map of download URL → download count for fast lookup.
		const downloadCountByUrl = new Map<string, number>();
		for (const release of releases) {
			for (const asset of release.assets) {
				downloadCountByUrl.set(asset.browser_download_url, asset.download_count);
			}
		}

		const versions = await db
			.select()
			.from(extensionVersion)
			.where(eq(extensionVersion.extensionId, extensionId));

		return versions.map((v) => ({
			versionId: v.id,
			count: downloadCountByUrl.get(v.downloadUrl) ?? 0
		}));
	}
}
