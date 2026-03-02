import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = () => {
	return Response.json({ ok: true });
};
