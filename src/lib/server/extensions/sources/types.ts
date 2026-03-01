import { GithubCodeSourceAdapter } from './code/github';

export type CodeSourceType = 'github';

export interface ExtensionMetadata {
	description: string | null;
	readme: string | null;
}

export interface CodeSourceAdapter {
	syncMetadata(extensionId: number, platform: App.Platform): Promise<ExtensionMetadata>;
}

export interface ArtifactSourceAdapter {
	/** Discovers new versions and syncs all files. Owns all DB writes. */
	discoverVersions(extensionId: number, platform: App.Platform): Promise<void>;
	syncDownloadCounts?(extensionId: number, platform: App.Platform): Promise<void>;
}

export function getCodeSourceAdapter(type: CodeSourceType): CodeSourceAdapter {
	switch (type) {
		case 'github':
			return new GithubCodeSourceAdapter();
	}
}
