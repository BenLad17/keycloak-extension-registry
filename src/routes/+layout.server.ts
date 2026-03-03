import type { LayoutServerLoad } from './$types';
import { getAuthenticatedUser } from '$lib/server/security/auth';
import { getCachedGitHubUser } from '$lib/server/github';
import { getEnv } from '$lib/server/env';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const env = getEnv(platform);
	const registryHost = new URL(env.REGISTRY_URL).host;

	const user = await getAuthenticatedUser(locals, platform!);
	if (!user) {
		return {
			user: null,
			providerRegistryBase: `${registryHost}/providers`
		};
	}

	const githubUser = await getCachedGitHubUser(user.githubId, platform!);
	return {
		user: githubUser,
		providerRegistryBase: `${registryHost}/providers`
	};
};
