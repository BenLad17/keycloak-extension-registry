import { Octokit } from 'octokit';
import { getEnv } from '$lib/server/env';

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 1 Week

export interface GitHubUser {
	id: number;
	login: string;
	email: string | null;
	avatarUrl: string;
	name: string | null;
}

export async function getCachedGitHubUser(
	githubId: number,
	platform: App.Platform
): Promise<GitHubUser | null> {
	const env = getEnv(platform);
	const cache = env.GITHUB_USERS;
	const cacheKey = githubId.toString();
	const cached = await cache.get(cacheKey);
	if (cached) {
		try {
			const cacheObj = JSON.parse(cached);
			return mapGitHubUser(cacheObj);
		} catch {
			// invalid cache
			await cache.delete(cacheKey);
		}
	}

	const user = await getGitHubUserById(githubId);
	if (user) {
		await cache.put(cacheKey, JSON.stringify(user), { expirationTtl: CACHE_TTL_SECONDS });
		return mapGitHubUser(user);
	}

	return null;
}

export async function getGitHubUserById(githubId: number) {
	const octokit = new Octokit();
	try {
		const response = await octokit.request('GET /user/{account_id}', { account_id: githubId });
		return response.data;
	} catch (err: any) {
		if (err.status === 404) return null;
		throw err;
	}
}

function mapGitHubUser(apiUser: any): GitHubUser {
	return {
		id: apiUser.id,
		login: apiUser.login,
		email: apiUser.email ?? null,
		avatarUrl: apiUser.avatar_url,
		name: apiUser.name ?? null
	};
}
