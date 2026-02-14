import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getDatabase, extensions } from '$lib/server/db';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) {
		redirect(302, '/api/auth/login');
	}

	const db = getDatabase(platform);

	// Get user's extensions
	const userExtensions = await db
		.select()
		.from(extensions)
		.where(eq(extensions.ownerId, locals.user.id));

	return {
		extensions: userExtensions
	};
};

