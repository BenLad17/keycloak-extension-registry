/**
 * API endpoint to load user's GitHub repositories
 * Much simpler than using form actions for async data loading
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserInstallationsWithRepos } from '$lib/server/github';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const env = getEnv(platform);

	try {
		const installationsWithRepos = await getUserInstallationsWithRepos(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			locals.user.githubId
		);

		const repos = installationsWithRepos.flatMap(installation =>
			installation.repos.map(r => ({
				fullName: r.full_name,
				name: r.name,
				htmlUrl: r.html_url,
				isPrivate: r.private
			}))
		);

		repos.sort((a, b) => a.fullName.localeCompare(b.fullName));

		return json({
			repos,
			needsInstallation: repos.length === 0
		});
	} catch (e) {
		console.error('Error fetching repos:', e);
		return json({
			repos: [],
			needsInstallation: true,
			error: e instanceof Error ? e.message : 'Failed to load repositories'
		});
	}
};

