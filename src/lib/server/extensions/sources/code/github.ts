import { extension as extensionTable, githubCodeSource, getDatabase } from '$lib/server/db';
import { getOctokitInstance } from '$lib/server/github';
import { eq } from 'drizzle-orm';
import type { CodeSourceAdapter, ExtensionMetadata } from '../types';

function toDisplayName(repoName: string): string {
	return repoName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export class GithubCodeSourceAdapter implements CodeSourceAdapter {
	async syncMetadata(extensionId: number, platform: App.Platform): Promise<ExtensionMetadata> {
		const db = getDatabase(platform);

		const [source] = await db
			.select()
			.from(githubCodeSource)
			.where(eq(githubCodeSource.extensionId, extensionId))
			.limit(1);

		if (!source) {
			throw new Error(`No GitHub code source configured for extension ${extensionId}`);
		}

		const octokit = getOctokitInstance(platform);

		const [repoResponse, readmeResponse] = await Promise.all([
			octokit.request('GET /repos/{owner}/{repo}', {
				owner: source.owner,
				repo: source.repo
			}),
			octokit
				.request('GET /repos/{owner}/{repo}/readme', {
					owner: source.owner,
					repo: source.repo,
					headers: { accept: 'application/vnd.github.raw+json' }
				})
				.catch(() => null) // README is optional
		]);

		const metadata: ExtensionMetadata = {
			name: toDisplayName(repoResponse.data.name),
			description: repoResponse.data.description ?? null,
			readme: readmeResponse ? String(readmeResponse.data) : null
		};

		await db
			.update(extensionTable)
			.set({ name: metadata.name, description: metadata.description, readme: metadata.readme })
			.where(eq(extensionTable.id, extensionId));

		return metadata;
	}
}
