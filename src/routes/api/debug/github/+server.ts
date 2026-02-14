/**
 * Debug endpoint to test GitHub App API access
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserInstallationsWithRepos, generateAppJWT } from '$lib/server/github';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Not logged in' }, { status: 401 });
	}

	const env = getEnv(platform);

	// Test 1: Check if App JWT works
	let appInfo = null;
	try {
		const jwt = await generateAppJWT(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY);
		const appRes = await fetch('https://api.github.com/app', {
			headers: {
				'Authorization': `Bearer ${jwt}`,
				'Accept': 'application/vnd.github.v3+json',
				'User-Agent': 'Keycloak-Extension-Registry'
			}
		});
		if (appRes.ok) {
			const appData = await appRes.json() as { id: number; name: string; slug: string };
			appInfo = {
				id: appData.id,
				name: appData.name,
				slug: appData.slug
			};
		}
	} catch (e) {
		appInfo = { error: e instanceof Error ? e.message : 'Unknown error' };
	}

	// Test 2: Get installations and repos for this user using App auth
	let installationsInfo = null;
	try {
		const installations = await getUserInstallationsWithRepos(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			locals.user.githubId
		);
		installationsInfo = {
			count: installations.length,
			installations: installations.map(i => ({
				installationId: i.installationId,
				repoCount: i.repos.length,
				repos: i.repos.map(r => r.full_name)
			}))
		};
	} catch (e) {
		installationsInfo = { error: e instanceof Error ? e.message : 'Unknown error' };
	}

	return json({
		user: {
			id: locals.user.id,
			githubId: locals.user.githubId,
			username: locals.user.username
		},
		app: appInfo,
		installations: installationsInfo,
		note: 'Using GitHub App authentication (not user tokens)'
	});
};

