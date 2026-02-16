import type { PageServerLoad } from './$types';
import { extension, getDatabase } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ platform, params }) => {
	const slug = params.slug;
	if (!slug) {
		throw redirect(301, '/');
	}
	const db = getDatabase(platform);
	const result = await db.select().from(extension).where(eq(extension.slug, slug));
	if (!result || result.length === 0) {
		throw error(404);
	}
	return {
		extension: result[0]
	};
};
