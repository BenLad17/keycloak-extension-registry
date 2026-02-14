/**
 * API: GET /api/auth/login
 * Initiates GitHub OAuth flow
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGitHubOAuthURL } from '$lib/server/github';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ cookies, url, platform }) => {
	const state = crypto.randomUUID();

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 600
	});

	const env = getEnv(platform);
	if (!env.GITHUB_CLIENT_ID) {
		throw new Error('GITHUB_CLIENT_ID not configured');
	}

	const redirectUri = `${url.origin}/api/auth/callback`;
	const authUrl = getGitHubOAuthURL(env.GITHUB_CLIENT_ID, redirectUri, state);

	redirect(302, authUrl);
};
