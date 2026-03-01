import type { PageServerLoad } from './$types';
import { getDatabase, extension, githubCodeSource, type ExtensionCategory } from '$lib/server/db';
import { eq, sql, and, desc } from 'drizzle-orm';

const SORTS = ['popular', 'newest', 'updated'] as const;
type Sort = (typeof SORTS)[number];

export const load: PageServerLoad = async ({ url, platform }) => {
	const q = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const rawSort = url.searchParams.get('sort') ?? '';
	const sort: Sort = (SORTS as readonly string[]).includes(rawSort) ? (rawSort as Sort) : 'popular';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const limit = 20;
	const offset = (page - 1) * limit;

	const db = getDatabase(platform);

	const conditions = [eq(extension.status, 'active')];
	if (q) {
		conditions.push(
			sql`(${extension.name} ILIKE ${`%${q}%`} OR ${extension.description} ILIKE ${`%${q}%`})`
		);
	}
	if (category) {
		conditions.push(eq(extension.category, category as ExtensionCategory));
	}
	const where = and(...conditions);

	const orderExpr =
		sort === 'newest'
			? desc(extension.createdAt)
			: sort === 'updated'
				? desc(extension.updatedAt)
				: desc(extension.downloadCount);

	const [results, countResult] = await Promise.all([
		db
			.select({
				extension,
				githubOwner: githubCodeSource.owner,
				githubRepo: githubCodeSource.repo,
				versionCount: sql<number>`(select count(*)::int from extension_version where extension_id = ${extension.id})`
			})
			.from(extension)
			.leftJoin(githubCodeSource, eq(githubCodeSource.extensionId, extension.id))
			.where(where)
			.orderBy(orderExpr)
			.limit(limit)
			.offset(offset),

		db
			.select({ count: sql<number>`count(*)::int` })
			.from(extension)
			.where(where)
	]);

	return {
		extensions: results,
		q,
		category,
		sort,
		page,
		total: Number(countResult[0]?.count ?? 0),
		totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit)
	};
};
