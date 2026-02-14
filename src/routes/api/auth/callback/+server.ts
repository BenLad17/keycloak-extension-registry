/**
 * API: GET /api/auth/callback
 * GitHub OAuth callback handler
 *
 * IMPORTANT: This OAuth flow is ONLY for user identification/authentication.
 * The access token obtained here is used temporarily to fetch the user's
 * GitHub ID and is then discarded.
 *
 * We only store the GitHub ID in our database - all profile data (username,
 * avatar, email) is fetched from GitHub's public API when needed and cached.
 *
 * Repository access is handled separately through GitHub App installation tokens,
 * NOT through user OAuth tokens.
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { exchangeCodeForToken, getGitHubUser } from '$lib/server/github';
import { createSessionToken, setSessionCookie } from '$lib/server/session';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	cookies.delete('oauth_state', { path: '/' });

	if (!code || !state || state !== storedState) {
		throw error(400, 'Invalid OAuth state');
	}

	const env = getEnv(platform);
	if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.JWT_SECRET) {
		throw error(500, 'OAuth not configured');
	}

	// Exchange code for a temporary token (used only to identify the user)
	// This token is NOT stored - it's only used to get the GitHub user ID
	const tempToken = await exchangeCodeForToken(code, env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);

	// Get GitHub user ID using the temporary token
	const githubUser = await getGitHubUser(tempToken);
	// Token is now discarded - all future GitHub API calls use App installation tokens

	// Upsert user in database (we only store the GitHub ID)
	const db = getDatabase(platform);

	let [user] = await db
		.select()
		.from(users)
		.where(eq(users.githubId, githubUser.id))
		.limit(1);

	if (!user) {
		// Create new user - only store GitHub ID
		[user] = await db
			.insert(users)
			.values({
				githubId: githubUser.id
			})
			.returning();
	}

	// Create session (minimal data - profile is fetched from GitHub when needed)
	const session = {
		userId: user.id,
		githubId: user.githubId,
		// Include these for convenience in the JWT, but they're also fetched fresh
		username: githubUser.login,
		avatarUrl: githubUser.avatar_url
	};

	const token = await createSessionToken(session, env.JWT_SECRET);
	setSessionCookie(cookies, token);

	redirect(302, '/dashboard');
};
