import type { PageServerLoad } from './$types';
import {
	getDatabase,
	extension,
	githubCodeSource,
	ExtensionCategoryLabel,
	type ExtensionCategory
} from '$lib/server/db';
import { eq, sql, and, asc, desc } from 'drizzle-orm';

const VALID_CATEGORIES = new Set(Object.keys(ExtensionCategoryLabel));

export const load: PageServerLoad = async ({ url, platform }) => {
	const query = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const sort = url.searchParams.get('sort') ?? 'downloads';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit = 20;
	const offset = (page - 1) * limit;

	const db = getDatabase(platform);

	const conditions = [];

	if (query) {
		conditions.push(
			sql`(${extension.name} LIKE ${`%${query}%`} OR ${extension.description} LIKE ${`%${query}%`})`
		);
	}

	if (category && VALID_CATEGORIES.has(category)) {
		conditions.push(eq(extension.category, category as ExtensionCategory));
	}

	conditions.push(eq(extension.status, 'active'));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	const [results, countResult] = await Promise.all([
		db
			.select({
				extension,
				githubOwner: githubCodeSource.owner,
				githubRepo: githubCodeSource.repo
			})
			.from(extension)
			.leftJoin(githubCodeSource, eq(githubCodeSource.extensionId, extension.id))
			.where(whereClause)
			.orderBy(
				sort === 'name'
					? asc(extension.name)
					: sort === 'updated'
						? desc(extension.lastSyncedAt)
						: desc(extension.downloadCount)
			)
			.limit(limit)
			.offset(offset),

		db
			.select({ count: sql<number>`count(*)` })
			.from(extension)
			.where(whereClause)
	]);

	const total = Number(countResult[0]?.count ?? 0);

	return {
		extensions: results,
		query,
		category,
		sort,
		page,
		total,
		totalPages: Math.ceil(total / limit)
	};
};
