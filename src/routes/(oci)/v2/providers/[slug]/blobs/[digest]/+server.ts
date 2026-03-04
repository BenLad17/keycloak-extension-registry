import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import { getGhcrToken } from '$lib/server/ghcr';

export const GET: RequestHandler = async ({ platform, params }) => {
	const { slug, digest } = params as { slug: string; digest: string };

	const env = getEnv(platform);
	const imagePath = `${env.REGISTRY_GITHUB_REPO}/providers/${slug}`.toLowerCase();

	const token = await getGhcrToken(imagePath);
	const res = await fetch(`https://ghcr.io/v2/${imagePath}/blobs/${digest}`, {
		headers: { Authorization: `Bearer ${token}` }
	});

	return new Response(res.body, res);
};
