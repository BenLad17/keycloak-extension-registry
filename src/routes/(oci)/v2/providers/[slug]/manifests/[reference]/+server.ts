import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import { incrementDownloadCount } from '$lib/server/extensions/downloads';

const handler: RequestHandler = async ({ platform, params, request }) => {
	const { slug, reference } = params as { slug: string; reference: string };

	const env = getEnv(platform);
	const [owner, repo] = env.REGISTRY_GITHUB_REPO.split('/');
	const imagePath = `${owner}/${repo}/providers/${slug}`.toLowerCase();

	if (request.method === 'GET' && !reference.startsWith('sha256:')) {
		platform?.ctx.waitUntil(incrementDownloadCount(slug, reference, platform));
	}

	return Response.redirect(`https://ghcr.io/v2/${imagePath}/manifests/${reference}`, 307);
};

export const GET = handler;
export const HEAD = handler;
