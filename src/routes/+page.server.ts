import type { PageServerLoad } from './$types';
import { getDatabase, extension, type ExtensionCategory } from '$lib/server/db';
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
			sql`(${extension.name} ILIKE ${`%${query}%`} OR ${extension.description} ILIKE ${`%${query}%`})`
		);
	}

	if (category) {
		conditions.push(eq(extension.category, category as ExtensionCategory));
	}

	conditions.push(eq(extension.status, 'active'));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Fetch extensions
	const [results, countResult] = await Promise.all([
		db
			.select()
			.from(extension)
			.where(whereClause)
			.orderBy(desc(extension.downloadCount))
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
		page,
		total,
		totalPages: Math.ceil(total / limit)
	};
};
