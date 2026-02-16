import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { destroySession } from '$lib/server/security/session';

export const POST: RequestHandler = async ({ platform, locals, url, cookies }) => {
	const redirectTo = url.searchParams.get('redirectTo') || '/';
	if (!redirectTo.startsWith('/')) {
		throw redirect(400, '/');
	}
	await destroySession(platform!, locals, cookies);
	redirect(302, redirectTo);
};
