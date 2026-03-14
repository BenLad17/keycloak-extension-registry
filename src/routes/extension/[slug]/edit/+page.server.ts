import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { extension, githubCodeSource, getDatabase, type ExtensionCategory } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import {
	requireAuth,
	hasRepoWriteAccess,
	isRegistryAdmin,
	GitHubTokenExpiredError,
	handleExpiredToken
} from '$lib/server/security/auth';
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

	try {
		const { ext, allowed } = await canEdit(params.slug, platform!, locals);
		if (!allowed)
			throw error(403, 'You need write access to this repository to edit this extension.');
		return { extension: ext };
	} catch (e) {
		if (e instanceof GitHubTokenExpiredError)
			await handleExpiredToken(platform!, locals, cookies, url);
		throw e;
	}
};

export const actions: Actions = {
	save: async ({ request, platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		let ext: Awaited<ReturnType<typeof canEdit>>['ext'];
		try {
			const result = await canEdit(params.slug, platform!, locals);
			if (!result.allowed) throw error(403);
			ext = result.ext;
		} catch (e) {
			if (e instanceof GitHubTokenExpiredError)
				await handleExpiredToken(platform!, locals, cookies, url);
			throw e;
		}

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

		try {
			const { ext, allowed } = await canEdit(params.slug, platform!, locals);
			if (!allowed) throw error(403);
			const token = locals.session?.githubToken;
			platform!.ctx.waitUntil(syncExtension(ext, platform!, token ?? undefined));
		} catch (e) {
			if (e instanceof GitHubTokenExpiredError)
				await handleExpiredToken(platform!, locals, cookies, url);
			throw e;
		}
		return { synced: true };
	},

	delete: async ({ platform, params, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		let ext: Awaited<ReturnType<typeof canEdit>>['ext'];
		try {
			const result = await canEdit(params.slug, platform!, locals);
			if (!result.allowed) throw error(403);
			ext = result.ext;
		} catch (e) {
			if (e instanceof GitHubTokenExpiredError)
				await handleExpiredToken(platform!, locals, cookies, url);
			throw e;
		}

		const db = getDatabase(platform);
		await db.delete(extension).where(eq(extension.id, ext.id));

		redirect(302, '/account');
	}
};
