import {
	extension as extensionTable,
	getDatabase,
	type Extension
} from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { getCodeSourceAdapter } from './sources/types';
import { GithubReleasesArtifactAdapter } from './sources/artifact/github-releases';
import { MavenCentralArtifactAdapter } from './sources/artifact/maven-central';
import type { ArtifactSourceAdapter } from './sources/types';
import { githubArtifactSource, mavenArtifactSource } from '$lib/server/db';

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
			await adapter.discoverVersions(ext.id, platform);
			await adapter.syncDownloadCounts?.(ext.id, platform);
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
