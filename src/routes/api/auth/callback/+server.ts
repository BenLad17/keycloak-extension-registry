import type { RequestHandler } from './$types';
import { processOAuthCallback } from '$lib/server/security/auth';

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	await processOAuthCallback(url, cookies, platform!);
	return new Response(null, { status: 204 });
};
