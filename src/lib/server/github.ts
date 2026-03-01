import { Octokit } from 'octokit';
import { getEnv } from '$lib/server/env';
import { createAppAuth } from '@octokit/auth-app';

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 1 Week
let octokitInstance: Octokit | null = null;

export interface GitHubUser {
	id: number;
	login: string;
	email: string | null;
	avatarUrl: string;
	name: string | null;
}

interface GitHubApiUser {
	id: number;
	login: string;
	email: string | null;
	avatar_url: string;
	name: string | null;
}

export function getOctokitInstance(platform: App.Platform): Octokit {
	if (!octokitInstance) {
		const env = getEnv(platform);
		octokitInstance = new Octokit({
			authStrategy: createAppAuth,
			auth: {
				appId: env.GITHUB_APP_ID,
				privateKey: env.GITHUB_PRIVATE_KEY,
				installationId: env.GITHUB_INSTALLATION_ID
			}
		});
	}
	return octokitInstance;
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
			const cacheObj = JSON.parse(cached) as GitHubApiUser;
			return mapGitHubUser(cacheObj);
		} catch {
			// invalid cache
			await cache.delete(cacheKey);
		}
	}

	const user = await getGitHubUserById(githubId, platform);
	if (user) {
		await cache.put(cacheKey, JSON.stringify(user), { expirationTtl: CACHE_TTL_SECONDS });
		return mapGitHubUser(user);
	}

	return null;
}

export async function getGitHubUserById(
	githubId: number,
	platform: App.Platform
): Promise<GitHubApiUser | null> {
	const octokit = getOctokitInstance(platform);
	try {
		const response = await octokit.request('GET /user/{account_id}', { account_id: githubId });
		return response.data as GitHubApiUser;
	} catch (err: unknown) {
		if (err !== null && typeof err === 'object' && 'status' in err && err.status === 404) {
			return null;
		}
		throw err;
	}
}

function mapGitHubUser(apiUser: GitHubApiUser): GitHubUser {
	return {
		id: apiUser.id,
		login: apiUser.login,
		email: apiUser.email ?? null,
		avatarUrl: apiUser.avatar_url,
		name: apiUser.name ?? null
	};
}