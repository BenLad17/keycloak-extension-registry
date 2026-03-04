import { GithubCodeSourceAdapter } from './code/github';

export type CodeSourceType = 'github';

export interface ExtensionMetadata {
	description: string | null;
	readme: string | null;
}

export interface CodeSourceAdapter {
	syncMetadata(extensionId: number, platform: App.Platform): Promise<ExtensionMetadata>;
}

export interface VersionDownloadCount {
	versionId: number;
	count: number;
}

export interface NewVersion {
	version: string;
	downloadUrl: string;
	digest: string;
	publishedAt: Date;
}

export interface ArtifactSourceAdapter {
	/** Discovers new versions and syncs all files. Owns all DB writes. Returns newly inserted versions. */
	discoverVersions(extensionId: number, platform: App.Platform): Promise<NewVersion[]>;
	/**
	 * Fetches the current download count for each known version.
	 * Returns raw counts only - persistence (including future history snapshots)
	 * is handled by the sync orchestrator in sync.ts.
	 */
	fetchDownloadCounts?(
		extensionId: number,
		platform: App.Platform
	): Promise<VersionDownloadCount[]>;
}

export function getCodeSourceAdapter(type: CodeSourceType): CodeSourceAdapter {
	switch (type) {
		case 'github':
			return new GithubCodeSourceAdapter();
	}
}
