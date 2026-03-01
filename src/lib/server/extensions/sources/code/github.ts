import { extension as extensionTable, githubCodeSource, getDatabase } from '$lib/server/db';
import { getOctokitInstance } from '$lib/server/github';
import { eq } from 'drizzle-orm';
import type { CodeSourceAdapter, ExtensionMetadata } from '../types';

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

		const description = repoResponse.data.description ?? null;
		const readme = readmeResponse ? String(readmeResponse.data) : null;

		await db
			.update(extensionTable)
			.set({ description, readme })
			.where(eq(extensionTable.id, extensionId));

		return { description, readme };
	}
}
