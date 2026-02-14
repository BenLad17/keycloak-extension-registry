/**
 * API: GET /api/extensions/[name]
 * Get extension metadata (npm-style registry response)
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase, extensions, versions, users } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, platform }) => {
	const { name } = params;
	const db = getDatabase(platform);

	// Get extension by slug
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.slug, name))
		.limit(1);

	if (!extension) {
		throw error(404, 'Extension not found');
	}

	// Get all versions
	const extensionVersions = await db
		.select()
		.from(versions)
		.where(eq(versions.extensionId, extension.id))
		.orderBy(desc(versions.publishedAt));

	// Get owner info from GitHub (cached)
	const [owner] = await db
		.select({ githubId: users.githubId })
		.from(users)
		.where(eq(users.id, extension.ownerId))
		.limit(1);

	// Fetch owner profile from GitHub
	const { getCache } = await import('$lib/server/cache');
	const { getCachedGitHubUser } = await import('$lib/server/github');
	const cache = getCache(platform);
	const ownerProfile = owner ? await getCachedGitHubUser(owner.githubId, cache) : null;

	// Find latest non-deprecated version
	const latestVersion = extensionVersions.find((v) => !v.deprecated);

	// Format npm-style response
	return json({
		name: extension.name,
		slug: extension.slug,
		description: extension.description,
		author: ownerProfile?.login,
		authorAvatar: ownerProfile?.avatar_url,
		license: extension.license,
		homepage: extension.homepage,
		repository: `https://github.com/${extension.githubRepo}`,
		category: extension.category,

		'dist-tags': {
			latest: latestVersion?.version ?? extensionVersions[0]?.version
		},

		versions: Object.fromEntries(
			extensionVersions.map((v) => [
				v.version,
				{
					version: v.version,
					publishedAt: v.publishedAt,
					keycloakCompatibility: v.keycloakCompatibility,
					deprecated: v.deprecated,
					deprecationMessage: v.deprecationMessage,
					releaseNotes: v.releaseNotes,
					dist: {
						jarUrl: v.jarUrl,
						sha256: v.sha256,
						size: v.jarSize
					}
				}
			])
		),

		stats: {
			downloads: extension.downloadCount
		},

		updatedAt: extension.updatedAt,
		createdAt: extension.createdAt
	});
};
