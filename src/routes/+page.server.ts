import type { PageServerLoad } from './$types';
import { getDatabase, extensions } from '$lib/server/db';
import { eq, sql, and, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url, platform }) => {
	const query = url.searchParams.get('q') || '';
	const category = url.searchParams.get('category') || '';
	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
	const limit = 20;
	const offset = (page - 1) * limit;

	const db = getDatabase(platform);

	// Build conditions
	const conditions = [];

	if (query) {
		conditions.push(
			sql`(${extensions.name} ILIKE ${`%${query}%`} OR ${extensions.description} ILIKE ${`%${query}%`})`
		);
	}

	if (category) {
		conditions.push(eq(extensions.category, category));
	}

	conditions.push(eq(extensions.status, 'active'));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch extensions
	const [results, countResult] = await Promise.all([
		db
			.select()
			.from(extensions)
			.where(whereClause)
			.orderBy(desc(extensions.downloadCount))
			.limit(limit)
			.offset(offset),

		db
			.select({ count: sql<number>`count(*)` })
			.from(extensions)
			.where(whereClause)
	]);

	const total = Number(countResult[0]?.count ?? 0);

	return {
		extensions: results,
		query,
		category,
		page,
		total,
		totalPages: Math.ceil(total / limit)
	};
};

