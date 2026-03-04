import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import { incrementDownloadCount } from '$lib/server/extensions/downloads';
import { getGhcrToken } from '$lib/server/ghcr';

const handler: RequestHandler = async ({ platform, params, request }) => {
	const { slug, reference } = params as { slug: string; reference: string };

	const env = getEnv(platform);
	const imagePath = `${env.REGISTRY_GITHUB_REPO}/providers/${slug}`.toLowerCase();

	if (request.method === 'GET' && !reference.startsWith('sha256:')) {
		platform?.ctx.waitUntil(incrementDownloadCount(slug, reference, platform));
	}

	let token: string;
	try {
		token = await getGhcrToken(imagePath);
	} catch {
		return new Response('{"errors":[{"code":"NAME_UNKNOWN","message":"repository not found"}]}', {
			status: 404,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const upstream = await fetch(`https://ghcr.io/v2/${imagePath}/manifests/${reference}`, {
		headers: {
			Accept: request.headers.get('Accept') ?? '*/*',
			Authorization: `Bearer ${token}`
		}
	});

	return upstream;
};

export const GET = handler;
export const HEAD = handler;
