import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	extension,
	githubCodeSource,
	githubArtifactSource,
	mavenArtifactSource,
	extensionVersion,
	extensionVersionFile,
	getDatabase,
	type ExtensionCategory
} from '$lib/server/db';
import { eq, inArray } from 'drizzle-orm';
import { requireAuth, canManageExtension, withReauth } from '$lib/server/security/auth';
import { syncExtension } from '$lib/server/extensions/sync';
import { ExtensionCategoryLabel } from '$lib/common/extension-category';
import { z } from 'zod';

const validCategories = Object.keys(ExtensionCategoryLabel) as [string, ...string[]];

const EditSchema = z.object({
	name: z.string().min(1, 'Name is required.').max(100, 'Name is too long.'),
	description: z
		.string()
		.max(500, 'Description is too long.')
		.transform((s) => s || null),
	category: z.enum(validCategories, { error: 'Invalid category.' }),
	status: z.enum(['active', 'archived'], { error: 'Invalid status.' })
});

async function loadExt(slug: string, platform: App.Platform) {
	const db = getDatabase(platform);
	const [ext] = await db.select().from(extension).where(eq(extension.slug, slug)).limit(1);
	if (!ext) throw error(404);
	const [source] = await db
		.select()
		.from(githubCodeSource)
		.where(eq(githubCodeSource.extensionId, ext.id))
		.limit(1);
	return { ext, source: source ?? null };
}

export const load: PageServerLoad = async ({ platform, params, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	return withReauth(platform!, locals, cookies, url, async () => {
		const { ext, source } = await loadExt(params.slug, platform!);
		if (!(await canManageExtension(source, locals, platform!)))
			throw error(403, 'You need write access to this repository to edit this extension.');
		return { extension: ext };
	});
};

export const actions: Actions = {
	save: async ({ request, platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const ext = await withReauth(platform!, locals, cookies, url, async () => {
			const loaded = await loadExt(params.slug, platform!);
			if (!(await canManageExtension(loaded.source, locals, platform!))) throw error(403);
			return loaded.ext;
		});

		const formData = await request.formData();
		const raw: Record<string, unknown> = {};
		for (const [key, value] of formData.entries()) {
			raw[key] = typeof value === 'string' ? value.trim() : value;
		}

		const parsed = EditSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message });
		}
		const { name, description, category, status } = parsed.data;

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

		await withReauth(platform!, locals, cookies, url, async () => {
			const { ext, source } = await loadExt(params.slug, platform!);
			if (!(await canManageExtension(source, locals, platform!))) throw error(403);
			platform!.ctx.waitUntil(syncExtension(ext, platform!, locals.session?.githubToken));
		});
		return { synced: true };
	},

	delete: async ({ platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const ext = await withReauth(platform!, locals, cookies, url, async () => {
			const loaded = await loadExt(params.slug, platform!);
			if (!(await canManageExtension(loaded.source, locals, platform!))) throw error(403);
			return loaded.ext;
		});

		const db = getDatabase(platform);

		// D1 doesn't enforce FK cascade deletes, so we delete child rows explicitly.
		const versions = await db
			.select({ id: extensionVersion.id })
			.from(extensionVersion)
			.where(eq(extensionVersion.extensionId, ext.id));
		if (versions.length > 0) {
			await db
				.delete(extensionVersionFile)
				.where(inArray(extensionVersionFile.versionId, versions.map((v) => v.id)));
		}
		await db.delete(extensionVersion).where(eq(extensionVersion.extensionId, ext.id));
		await db.delete(githubArtifactSource).where(eq(githubArtifactSource.extensionId, ext.id));
		await db.delete(mavenArtifactSource).where(eq(mavenArtifactSource.extensionId, ext.id));
		await db.delete(githubCodeSource).where(eq(githubCodeSource.extensionId, ext.id));
		await db.delete(extension).where(eq(extension.id, ext.id));

		redirect(302, '/account');
	}
};
