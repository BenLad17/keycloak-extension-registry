import {
	extension as extensionTable,
	extensionVersion,
	getDatabase,
	type Extension
} from '$lib/server/db';
import { and, eq, lt, sql } from 'drizzle-orm';
import { getCodeSourceAdapter } from './sources/types';
import { GithubReleasesArtifactAdapter } from './sources/artifact/github-releases';
import { MavenCentralArtifactAdapter } from './sources/artifact/maven-central';
import type { ArtifactSourceAdapter, NewVersion } from './sources/types';
import { githubArtifactSource, mavenArtifactSource } from '$lib/server/db';
import { getOctokitInstance } from '$lib/server/github';
import { getEnv } from '$lib/server/env';

// Versions whose build might still be in-flight are ignored until this window passes.
const BUILD_RETRY_DELAY_MS = 15 * 60 * 1000; // 15 minutes
// Max unbuilt versions to retry per extension per sync, to avoid flooding CI.
const MAX_RETRY_PER_SYNC = 2;

export async function syncExtension(
	ext: Extension,
	platform: App.Platform,
	githubToken?: string
): Promise<void> {
	const db = getDatabase(platform);
	try {
		const codeAdapter = getCodeSourceAdapter(ext.codeSourceType);
		await codeAdapter.syncMetadata(ext.id, platform);

		const [ghSource] = await db
			.select()
			.from(githubArtifactSource)
			.where(eq(githubArtifactSource.extensionId, ext.id))
			.limit(1);
		const [mavenSource] = await db
			.select()
			.from(mavenArtifactSource)
			.where(eq(mavenArtifactSource.extensionId, ext.id))
			.limit(1);

		const adapters: ArtifactSourceAdapter[] = [];
		if (ghSource) adapters.push(new GithubReleasesArtifactAdapter(githubToken));
		if (mavenSource) adapters.push(new MavenCentralArtifactAdapter());

		for (const adapter of adapters) {
			const newVersions = await adapter.discoverVersions(ext.id, platform);

			for (const v of newVersions) {
				await triggerProviderImageBuild(ext.slug, v, platform);
			}

			// Retry versions whose image build may have failed. Only consider versions
			// old enough that any in-flight build has had time to complete or fail.
			const retryDeadline = new Date(Date.now() - BUILD_RETRY_DELAY_MS);
			const unbuilt = await db
				.select({
					version: extensionVersion.version,
					downloadUrl: extensionVersion.downloadUrl,
					digest: extensionVersion.digest
				})
				.from(extensionVersion)
				.where(
					and(
						eq(extensionVersion.extensionId, ext.id),
						eq(extensionVersion.providerImageBuilt, false),
						lt(extensionVersion.publishedAt, retryDeadline)
					)
				)
				.limit(MAX_RETRY_PER_SYNC);

			for (const v of unbuilt) {
				await triggerProviderImageBuild(ext.slug, v, platform);
			}

			if (adapter.fetchDownloadCounts) {
				const counts = await adapter.fetchDownloadCounts(ext.id, platform);

				// Persist per-version counts.
				// TODO: when download history is implemented, record a snapshot here too.
				for (const { versionId, count } of counts) {
					await db
						.update(extensionVersion)
						.set({ downloadCount: count })
						.where(eq(extensionVersion.id, versionId));
				}

				// Re-compute the extension-level total from the DB so all sources are included.
				const [{ total }] = await db
					.select({ total: sql<number>`coalesce(sum(${extensionVersion.downloadCount}), 0)` })
					.from(extensionVersion)
					.where(eq(extensionVersion.extensionId, ext.id));

				await db
					.update(extensionTable)
					.set({ downloadCount: Number(total) })
					.where(eq(extensionTable.id, ext.id));
			}
		}

		await db
			.update(extensionTable)
			.set({ lastSyncedAt: new Date(), lastSyncError: null })
			.where(eq(extensionTable.id, ext.id));
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`Error syncing extension ${ext.id}:`, error);
		await db
			.update(extensionTable)
			.set({ lastSyncedAt: new Date(), lastSyncError: message })
			.where(eq(extensionTable.id, ext.id));
	}
}

async function triggerProviderImageBuild(
	slug: string,
	v: NewVersion,
	platform: App.Platform
): Promise<void> {
	try {
		const env = getEnv(platform);
		const [owner, repo] = env.REGISTRY_GITHUB_REPO.split('/');
		const octokit = getOctokitInstance(platform);
		await octokit.request(
			'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches',
			{
				owner,
				repo,
				workflow_id: 'build-provider-image.yml',
				ref: 'master',
				inputs: {
					slug,
					version: v.version,
					download_url: v.downloadUrl,
					digest: v.digest
				}
			}
		);
		console.log(`Triggered provider image build for ${slug}@${v.version}`);
	} catch (err) {
		console.error(`Failed to trigger provider image build for ${slug}@${v.version}:`, err);
	}
}
