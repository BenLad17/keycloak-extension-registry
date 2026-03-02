import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { extension, githubCodeSource, getDatabase, type ExtensionCategory } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { requireAuth, hasRepoWriteAccess, isRegistryAdmin } from '$lib/server/security/auth';
import { syncExtension } from '$lib/server/extensions/sync';
import { ExtensionCategoryLabel } from '$lib/common/extension-category';

const VALID_CATEGORIES = new Set(Object.keys(ExtensionCategoryLabel));
const VALID_STATUSES = new Set(['active', 'archived']);

async function canEdit(
	slug: string,
	platform: App.Platform,
	locals: App.Locals
): Promise<{ ext: typeof extension.$inferSelect; allowed: boolean }> {
	if (!locals.session) return { ext: null as never, allowed: false };

	const db = getDatabase(platform);
	const [ext] = await db.select().from(extension).where(eq(extension.slug, slug)).limit(1);
	if (!ext) throw error(404);

	const [source] = await db
		.select()
		.from(githubCodeSource)
		.where(eq(githubCodeSource.extensionId, ext.id))
		.limit(1);

	if (!source) return { ext, allowed: false };

	const token = locals.session.githubToken;
	const repoAccess = token ? await hasRepoWriteAccess(token, source.owner, source.repo) : false;
	const adminAccess = await isRegistryAdmin(locals, platform);
	return { ext, allowed: repoAccess || adminAccess };
}

export const load: PageServerLoad = async ({ platform, params, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	const { ext, allowed } = await canEdit(params.slug, platform!, locals);
	if (!allowed)
		throw error(403, 'You need write access to this repository to edit this extension.');

	return { extension: ext };
};

export const actions: Actions = {
	default: async ({ request, platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const { ext, allowed } = await canEdit(params.slug, platform!, locals);
		if (!allowed) throw error(403);

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const description = (formData.get('description') as string)?.trim() || null;
		const category = formData.get('category') as string;
		const status = formData.get('status') as string;

		if (!name || !category) {
			return fail(400, { error: 'Name and category are required.' });
		}

		if (!VALID_CATEGORIES.has(category)) {
			return fail(400, { error: 'Invalid category.' });
		}

		if (!VALID_STATUSES.has(status)) {
			return fail(400, { error: 'Invalid status.' });
		}

		const db = getDatabase(platform);
		await db
			.update(extension)
			.set({
				name,
				description,
				category: category as ExtensionCategory,
				status,
				updatedAt: new Date()
			})
			.where(eq(extension.id, ext.id));

		redirect(302, `/extension/${params.slug}`);
	},

	sync: async ({ platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const { ext, allowed } = await canEdit(params.slug, platform!, locals);
		if (!allowed) throw error(403);

		const token = locals.session?.githubToken;
		await syncExtension(ext, platform!, token ?? undefined);
		return { synced: true };
	},

	delete: async ({ platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const { ext, allowed } = await canEdit(params.slug, platform!, locals);
		if (!allowed) throw error(403);

		const db = getDatabase(platform);
		await db.delete(extension).where(eq(extension.id, ext.id));

		redirect(302, '/dashboard');
	}
};
