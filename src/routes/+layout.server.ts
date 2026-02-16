import type { LayoutServerLoad } from './$types';
import { getAuthenticatedUser } from '$lib/server/security/auth';
import { getCachedGitHubUser } from '$lib/server/github';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const user = await getAuthenticatedUser(locals, platform!);
	if(!user){
		return {
			user: null
		};
	}

	const githubUser = await getCachedGitHubUser(user.githubId, platform!);
	return {
		user: githubUser
	};
};
