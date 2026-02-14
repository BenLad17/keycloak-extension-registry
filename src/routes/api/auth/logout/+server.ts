/**
 * API: POST /api/auth/logout
 * Clear session and logout user
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { clearSessionCookie } from '$lib/server/session';

export const POST: RequestHandler = async ({ cookies }) => {
	clearSessionCookie(cookies);
	throw redirect(302, '/');
};

