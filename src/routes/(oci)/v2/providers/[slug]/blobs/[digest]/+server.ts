import type { RequestHandler } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';

export const GET: RequestHandler = async ({ platform, params }) => {
	const { slug, digest } = params as { slug: string; digest: string };

	const env = getEnv(platform);
	const [owner, repo] = env.REGISTRY_GITHUB_REPO.split('/');

	return fetch(`https://ghcr.io/v2/${owner}/${repo}/providers/${slug}/blobs/${digest}`);
};
