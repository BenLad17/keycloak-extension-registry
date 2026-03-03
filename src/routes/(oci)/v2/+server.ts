import type { RequestHandler } from '@sveltejs/kit';

const handler: RequestHandler = async () =>
	Response.json({}, { headers: { 'Docker-Distribution-Api-Version': 'registry/2.0' } });

export const GET = handler;
export const HEAD = handler;
