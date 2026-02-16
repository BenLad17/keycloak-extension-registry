import type { RequestHandler } from './$types';
import { initializeAuth } from '$lib/server/security/auth';

export const GET: RequestHandler = async ({ cookies, url, platform }) => {
	const redirectTo = url.searchParams.get('redirectTo') || '/';
	await initializeAuth(url, cookies, platform!, redirectTo);
	return new Response(null, { status: 204 });
};
