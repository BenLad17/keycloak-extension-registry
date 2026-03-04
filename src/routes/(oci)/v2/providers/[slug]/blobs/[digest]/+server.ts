import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ platform, params }) => {
	const { slug, digest } = params as { slug: string; digest: string };

	const env = getEnv(platform);
	const imagePath = `${env.REGISTRY_GITHUB_REPO}/providers/${slug}`.toLowerCase();

	return new Response(null, {
		status: 307,
		headers: { Location: `https://ghcr.io/v2/${imagePath}/blobs/${digest}` }
	});
};
