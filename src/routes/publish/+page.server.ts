import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	extension,
	githubCodeSource,
	githubArtifactSource,
	mavenArtifactSource,
	getDatabase,
	type Database
} from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { Octokit } from 'octokit';
import { requireAuth, hasRepoWriteAccess } from '$lib/server/security/auth';
import { syncExtension } from '$lib/server/extensions/sync';

function toSlug(s: string): string {
	return s
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

export const load: PageServerLoad = async ({ platform, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	const token = locals.session!.githubToken;
	let repos: UserRepo[] = [];

	if (token) {
		try {
			const octokit = new Octokit({ auth: token });
			const { data } = await octokit.request('GET /user/repos', {
				affiliation: 'owner,organization_member',
				sort: 'updated',
				per_page: 100
			});
			repos = data
				.filter((r) => r.permissions?.push)
				.map((r) => ({
					owner: r.owner.login,
					name: r.name,
					description: r.description ?? null
				}));
		} catch {
			// Non-fatal — fall back to empty list; user can still type manually
		}
	}

	return { repos };
};

export const actions: Actions = {
	default: async ({ request, platform, locals, url, cookies }) => {
		await requireAuth(url, cookies, platform!, locals);

		const token = locals.session?.githubToken;
		if (!token) {
			return fail(401, { error: 'Authentication required.' });
		}

		const formData = await request.formData();

		const category = formData.get('category') as string;
		const githubOwner = (formData.get('githubOwner') as string)?.trim();
		const githubRepo = (formData.get('githubRepo') as string)?.trim();
		const useGithubReleases = formData.get('useGithubReleases') === 'on';
		const useMavenCentral = formData.get('useMavenCentral') === 'on';
		const artifactOwner = (formData.get('artifactOwner') as string)?.trim();
		const artifactRepo = (formData.get('artifactRepo') as string)?.trim();
		const mavenGroupId = (formData.get('mavenGroupId') as string)?.trim();
		const mavenArtifactId = (formData.get('mavenArtifactId') as string)?.trim();

		if (!category || !githubOwner || !githubRepo) {
			return fail(400, { error: 'Missing required fields.' });
		}
		if (!useGithubReleases && !useMavenCentral) {
			return fail(400, { error: 'At least one artifact source is required.' });
		}
		if (useGithubReleases && (!artifactOwner || !artifactRepo)) {
			return fail(400, { error: 'GitHub artifact owner and repo are required.' });
		}
		if (useMavenCentral && (!mavenGroupId || !mavenArtifactId)) {
			return fail(400, { error: 'Maven groupId and artifactId are required.' });
		}

		const octokit = new Octokit({ auth: token });

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

		const canWrite = await hasRepoWriteAccess(token, githubOwner, githubRepo);
		if (!canWrite) {
			return fail(403, {
				error: `You need write access to ${githubOwner}/${githubRepo} to publish it.`
			});
		}

		const db = getDatabase(platform);
		const slug = await generateSlug(githubRepo, db);

		const [inserted] = await db
			.insert(extension)
			.values({
				slug,
				name: repoData.name,
				description: repoData.description,
				category: category as 'authentication' | 'user_federation',
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

		if (useGithubReleases) {
			await db.insert(githubArtifactSource).values({
				extensionId: inserted.id,
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

		await syncExtension(inserted, platform!, token);

		redirect(302, `/extension/${inserted.slug}?published=true`);
	}
};
