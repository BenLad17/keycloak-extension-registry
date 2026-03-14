import type { PageServerLoad } from './$types';
import { extension, extensionVersion, githubCodeSource, getDatabase } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import { canManageExtension, GitHubTokenExpiredError } from '$lib/server/security/auth';

export const load: PageServerLoad = async ({ platform, params, locals }) => {
	const slug = params.slug;
	if (!slug) {
		throw redirect(301, '/');
	}
	const db = getDatabase(platform);

	const [ext] = await db.select().from(extension).where(eq(extension.slug, slug));
	if (!ext) {
		throw error(404);
	}

	const [githubSource] = await db
		.select()
		.from(githubCodeSource)
		.where(eq(githubCodeSource.extensionId, ext.id))
		.limit(1);

	const versions = await db
		.select()
		.from(extensionVersion)
		.where(eq(extensionVersion.extensionId, ext.id))
		.orderBy(desc(extensionVersion.publishedAt));

	let canManage = false;
	try {
		canManage = await canManageExtension(githubSource ?? null, locals, platform!);
	} catch (e) {
		if (!(e instanceof GitHubTokenExpiredError)) throw e;
		// Stale token — hide management UI rather than forcing re-auth on a read page
	}

	return {
		extension: ext,
		versions,
		githubSource: githubSource ?? null,
		canManage
	};
};
