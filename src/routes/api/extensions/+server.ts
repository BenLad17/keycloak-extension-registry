/**
 * API: GET /api/extensions
 * Search and list extensions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase, extensions } from '$lib/server/db';
import { eq, sql, and, desc } from 'drizzle-orm';
import { searchExtensionsSchema } from '$lib/server/validation';

export const GET: RequestHandler = async ({ url, platform }) => {
	// Parse and validate query params
	const params = searchExtensionsSchema.parse({
		q: url.searchParams.get('q') || undefined,
		category: url.searchParams.get('category') || undefined,
		kc: url.searchParams.get('kc') || undefined,
		page: url.searchParams.get('page') || 1,
		limit: url.searchParams.get('limit') || 20
	});

	const offset = (params.page - 1) * params.limit;
	const db = getDatabase(platform);

	// Build where conditions
	const conditions = [];

	if (params.q) {
		conditions.push(
			sql`(${extensions.name} ILIKE ${`%${params.q}%`} OR ${extensions.description} ILIKE ${`%${params.q}%`})`
		);
	}

	if (params.category) {
		conditions.push(eq(extensions.category, params.category));
	}

	// Only active extensions
	conditions.push(eq(extensions.status, 'active'));

	const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

	// Get extensions with pagination
	const [results, countResult] = await Promise.all([
		db
			.select()
			.from(extensions)
			.where(whereClause)
			.orderBy(desc(extensions.downloadCount))
			.limit(params.limit)
			.offset(offset),

		db
			.select({ count: sql<number>`count(*)` })
			.from(extensions)
			.where(whereClause)
	]);

	const total = Number(countResult[0]?.count ?? 0);

	return json({
		extensions: results,
		total,
		page: params.page,
		limit: params.limit,
		totalPages: Math.ceil(total / params.limit)
	});
};
