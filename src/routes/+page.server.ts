import type { PageServerLoad } from './$types';
import { getDatabase, extension } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ platform }) => {
	const db = getDatabase(platform);

	const [stats] = await db
		.select({
			count: sql<number>`count(*)`,
			total: sql<number>`coalesce(sum(${extension.downloadCount}), 0)`
		})
		.from(extension)
		.where(eq(extension.status, 'active'));

	return {
		extensionCount: Number(stats?.count ?? 0),
		totalDownloads: Number(stats?.total ?? 0)
	};
};
