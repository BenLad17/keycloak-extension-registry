import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getDatabase, extensions, versions, users } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, platform }) => {
	const { slug } = params;
	const db = getDatabase(platform);

	// Get extension
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.slug, slug))
		.limit(1);

	if (!extension) {
		throw error(404, 'Extension not found');
	}

	// Get versions
	const extensionVersions = await db
		.select()
		.from(versions)
		.where(eq(versions.extensionId, extension.id))
		.orderBy(desc(versions.publishedAt));

	// Get owner's GitHub ID
	const [ownerRecord] = await db
		.select({ githubId: users.githubId })
		.from(users)
		.where(eq(users.id, extension.ownerId))
		.limit(1);

	// Fetch owner profile from GitHub (cached)
	const { getCache } = await import('$lib/server/cache');
	const { getCachedGitHubUser } = await import('$lib/server/github');
	const cache = getCache(platform);
	const ownerProfile = ownerRecord ? await getCachedGitHubUser(ownerRecord.githubId, cache) : null;

	const owner = ownerProfile ? {
		username: ownerProfile.login,
		avatarUrl: ownerProfile.avatar_url
	} : null;

	return {
		extension,
		versions: extensionVersions,
		owner,
		isPending: extension.status === 'pending'
	};
};

