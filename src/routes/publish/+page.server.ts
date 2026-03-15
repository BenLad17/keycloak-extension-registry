import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	extension,
	githubCodeSource,
	githubArtifactSource,
	mavenArtifactSource,
	getDatabase,
	type Database,
	type ExtensionCategory
} from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { getUserOctokit } from '$lib/server/github';
import {
	requireAuth,
	hasRepoWriteAccess,
	withReauth,
	isGitHub401
} from '$lib/server/security/auth';
import { syncExtension } from '$lib/server/extensions/sync';
import { ExtensionCategoryLabel } from '$lib/common/extension-category';
import { z } from 'zod';

const validCategories = Object.keys(ExtensionCategoryLabel) as [string, ...string[]];

const githubOwnerSchema = z
	.string()
	.min(1, 'GitHub owner is required.')
	.max(39, 'GitHub owner is too long.')
	.regex(/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/, 'Invalid GitHub owner name.');

const githubRepoSchema = z
	.string()
	.min(1, 'GitHub repository is required.')
	.max(100, 'GitHub repository name is too long.')
	.regex(/^[a-zA-Z0-9._-]+$/, 'Invalid GitHub repository name.');

const mavenCoordSchema = (field: string) =>
	z
		.string()
		.max(200, `${field} is too long.`)
		.regex(/^[a-zA-Z0-9._-]*$/, `Invalid ${field}.`);

const PublishSchema = z
	.object({
		category: z.enum(validCategories, { error: 'Invalid category.' }),
		githubOwner: githubOwnerSchema,
		githubRepo: githubRepoSchema,
		useGithubReleases: z.literal('on').optional(),
		useMavenCentral: z.literal('on').optional(),
		artifactOwner: githubOwnerSchema.or(z.literal('')).default(''),
		artifactRepo: githubRepoSchema.or(z.literal('')).default(''),
		mavenGroupId: mavenCoordSchema('Maven groupId').default(''),
		mavenArtifactId: mavenCoordSchema('Maven artifactId').default('')
	})
	.superRefine((data, ctx) => {
		if (!data.useGithubReleases && !data.useMavenCentral) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'At least one artifact source is required.'
			});
		}
		if (data.useGithubReleases) {
			if (!data.artifactOwner)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['artifactOwner'],
					message: 'GitHub artifact owner is required.'
				});
			if (!data.artifactRepo)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['artifactRepo'],
					message: 'GitHub artifact repo is required.'
				});
		}
		if (data.useMavenCentral) {
			if (!data.mavenGroupId)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['mavenGroupId'],
					message: 'Maven groupId is required.'
				});
			if (!data.mavenArtifactId)
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['mavenArtifactId'],
					message: 'Maven artifactId is required.'
				});
		}
	});

function stripKeycloakPrefix(name: string): string {
	return name.replace(/^keycloak[-_]?/i, '') || name;
}

function toDisplayName(repoName: string): string {
	return stripKeycloakPrefix(repoName)
		.replace(/[-_]+/g, ' ')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function toSlug(s: string): string {
	return stripKeycloakPrefix(s)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

async function generateSlug(base: string, db: Database): Promise<string> {
	const candidate = toSlug(base);
	const [existing] = await db
		.select({ slug: extension.slug })
		.from(extension)
		.where(eq(extension.slug, candidate))
		.limit(1);
	if (!existing) return candidate;

	for (let i = 2; ; i++) {
		const suffixed = `${candidate}-${i}`;
		const [clash] = await db
			.select({ slug: extension.slug })
			.from(extension)
			.where(eq(extension.slug, suffixed))
			.limit(1);
		if (!clash) return suffixed;
	}
}

export interface UserRepo {
	owner: string;
	name: string;
	description: string | null;
}

async function fetchUserRepos(token: string, platform: App.Platform): Promise<UserRepo[]> {
	const db = getDatabase(platform);
	const registered = await db.select({ repoId: githubCodeSource.repoId }).from(githubCodeSource);
	const registeredIds = new Set(registered.map((r) => r.repoId));

	const octokit = getUserOctokit(token);
	try {
		const { data } = await octokit.request('GET /user/repos', {
			affiliation: 'owner,collaborator,organization_member',
			sort: 'updated',
			per_page: 100
		});
		return data
			.filter((r) => r.visibility === 'public' && r.permissions?.push && !registeredIds.has(r.id))
			.map((r) => ({
				owner: r.owner.login,
				name: r.name,
				description: r.description ?? null
			}));
	} catch (e) {
		if (isGitHub401(e)) throw e;
		return [];
	}
}

export const load: PageServerLoad = async ({ platform, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	const token = locals.session!.githubToken;

	return {
		repos: token
			? await withReauth(platform!, locals, cookies, url, () => fetchUserRepos(token, platform!))
			: ([] as UserRepo[])
	};
};

export const actions: Actions = {
	default: async ({ request, platform, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const token = locals.session?.githubToken;
		if (!token) {
			return fail(401, { error: 'Authentication required.' });
		}

		const formData = await request.formData();
		const raw: Record<string, unknown> = {};
		for (const [key, value] of formData.entries()) {
			raw[key] = typeof value === 'string' ? value.trim() : value;
		}

		const parsed = PublishSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message });
		}
		const {
			category,
			githubOwner,
			githubRepo,
			useGithubReleases,
			useMavenCentral,
			artifactOwner,
			artifactRepo,
			mavenGroupId,
			mavenArtifactId
		} = parsed.data;

		const octokit = getUserOctokit(token);

		let repoData: { id: number; name: string; description: string | null };
		try {
			const response = await octokit.request('GET /repos/{owner}/{repo}', {
				owner: githubOwner,
				repo: githubRepo
			});
			repoData = {
				id: response.data.id,
				name: response.data.name,
				description: response.data.description ?? null
			};
		} catch {
			return fail(400, {
				error: `GitHub repo ${githubOwner}/${githubRepo} not found or inaccessible.`
			});
		}

		const canWrite = await withReauth(platform!, locals, cookies, url, () =>
			hasRepoWriteAccess(token, githubOwner, githubRepo)
		);
		if (!canWrite) {
			return fail(403, {
				error: `You need write access to ${githubOwner}/${githubRepo} to publish it.`
			});
		}

		// Resolve artifact repo ID before entering the transaction (no API calls inside tx).
		let artifactRepoId: number | undefined;
		if (useGithubReleases) {
			if (artifactOwner === githubOwner && artifactRepo === githubRepo) {
				artifactRepoId = repoData.id;
			} else {
				try {
					const { data } = await octokit.request('GET /repos/{owner}/{repo}', {
						owner: artifactOwner,
						repo: artifactRepo
					});
					artifactRepoId = data.id;
				} catch {
					return fail(400, {
						error: `GitHub artifact repo ${artifactOwner}/${artifactRepo} not found or inaccessible.`
					});
				}
			}
		}

		const db = getDatabase(platform);
		const slug = await generateSlug(githubRepo, db);

		const [inserted] = await db
			.insert(extension)
			.values({
				slug,
				name: toDisplayName(repoData.name),
				description: repoData.description,
				category: category as ExtensionCategory,
				codeSourceType: 'github',
				ownerId: locals.session!.userId,
				status: 'active'
			})
			.returning();

		await db.insert(githubCodeSource).values({
			extensionId: inserted.id,
			repoId: repoData.id,
			owner: githubOwner,
			repo: githubRepo
		});

		if (artifactRepoId !== undefined) {
			await db.insert(githubArtifactSource).values({
				extensionId: inserted.id,
				repoId: artifactRepoId,
				owner: artifactOwner,
				repo: artifactRepo
			});
		}
		if (useMavenCentral) {
			await db.insert(mavenArtifactSource).values({
				extensionId: inserted.id,
				groupId: mavenGroupId,
				artifactId: mavenArtifactId
			});
		}

		// Kick off the initial sync in the background - the success banner already
		// tells the user that versions will sync in the background.
		platform!.ctx.waitUntil(syncExtension(inserted, platform!, token));

		redirect(302, `/extension/${inserted.slug}?published=true`);
	}
};
