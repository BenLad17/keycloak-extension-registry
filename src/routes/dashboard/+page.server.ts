import type { PageServerLoad } from './$types';
import { extension, githubCodeSource, getDatabase } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import { requireAuth } from '$lib/server/security/auth';

export const load: PageServerLoad = async ({ platform, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	const db = getDatabase(platform);

	const extensions = await db
		.select({
			id: extension.id,
			slug: extension.slug,
			name: extension.name,
			description: extension.description,
			category: extension.category,
			status: extension.status,
			downloadCount: extension.downloadCount,
			updatedAt: extension.updatedAt,
			githubOwner: githubCodeSource.owner,
			githubRepo: githubCodeSource.repo
		})
		.from(extension)
		.leftJoin(githubCodeSource, eq(githubCodeSource.extensionId, extension.id))
		.where(eq(extension.ownerId, locals.session!.userId))
		.orderBy(desc(extension.updatedAt));

	return { extensions };
};
