/**
 * Server hooks for SvelteKit
 *
 * Runs on every request before route handlers.
 * Used for:
 * - Session validation
 * - Adding user to locals
 */

import type { Handle } from '@sveltejs/kit';
import { verifySessionToken } from '$lib/server/session';
import { getDatabase, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getCachedGitHubUser } from '$lib/server/github';
import { getCache } from '$lib/server/cache';

export const handle: Handle = async ({ event, resolve }) => {
	// Get session from cookie
	const sessionToken = event.cookies.get('session');
	const jwtSecret = env.JWT_SECRET;

	if (sessionToken && jwtSecret) {
		try {
			const session = await verifySessionToken(sessionToken, jwtSecret);
			if (session) {
				// Verify user exists in DB
				const db = getDatabase(event.platform);
				const [user] = await db
					.select()
					.from(users)
					.where(eq(users.id, session.userId))
					.limit(1);

				if (user) {
					// Get profile data from GitHub (cached via KV)
					const cache = getCache(event.platform);
					const githubProfile = await getCachedGitHubUser(user.githubId, cache);

					event.locals.user = {
						id: user.id,
						githubId: user.githubId,
						username: githubProfile?.login ?? `user-${user.githubId}`,
						avatarUrl: githubProfile?.avatar_url ?? null
					};
				} else {
					// User was deleted from DB - clear session
					event.cookies.delete('session', { path: '/' });
				}
			}
		} catch {
			// Invalid session - clear cookie
			event.cookies.delete('session', { path: '/' });
		}
	}

	// Protected routes check
	const protectedPaths = ['/dashboard', '/publish'];
	const isProtected = protectedPaths.some((path) => event.url.pathname.startsWith(path));

	if (isProtected && !event.locals.user) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/api/auth/login' }
		});
	}

	return resolve(event);
};
