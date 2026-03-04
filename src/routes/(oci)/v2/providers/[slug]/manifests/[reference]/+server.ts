import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';
import { incrementDownloadCount } from '$lib/server/extensions/downloads';

const handler: RequestHandler = async ({ platform, params, request }) => {
	const { slug, reference } = params as { slug: string; reference: string };

	const env = getEnv(platform);
	const [owner, repo] = env.REGISTRY_GITHUB_REPO.split('/');

	const upstreamResponse = await fetch(
		`https://ghcr.io/v2/${owner}/${repo}/providers/${slug}/manifests/${reference}`,
		{ headers: { Accept: request.headers.get('Accept') ?? '*/*' } }
	);

	if (upstreamResponse.ok && request.method === 'GET' && !reference.startsWith('sha256:')) {
		platform?.ctx.waitUntil(incrementDownloadCount(slug, reference, platform));
	}

	return new Response(upstreamResponse.body, upstreamResponse);
};

export const GET = handler;
export const HEAD = handler;
