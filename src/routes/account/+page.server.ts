import type { PageServerLoad } from './$types';
import { extension, githubCodeSource, getDatabase } from '$lib/server/db';
import { eq, desc, inArray } from 'drizzle-orm';
import {
	requireAuth,
	isRegistryAdmin,
	withReauth,
	isGitHub401
} from '$lib/server/security/auth';
import { getUserOctokit } from '$lib/server/github';

async function getUserPushRepoIds(token: string): Promise<Set<number>> {
	const octokit = getUserOctokit(token);
	try {
		const { data } = await octokit.request('GET /user/repos', {
			affiliation: 'owner,collaborator,organization_member',
			per_page: 100
		});
		return new Set(data.filter((r) => r.permissions?.push).map((r) => r.id));
	} catch (e) {
		if (isGitHub401(e)) throw e;
		return new Set();
	}
}

const extensionFields = {
	id: extension.id,
	slug: extension.slug,
	name: extension.name,
	description: extension.description,
	category: extension.category,
	status: extension.status,
	downloadCount: extension.downloadCount,
	updatedAt: extension.updatedAt,
	lastSyncedAt: extension.lastSyncedAt,
	lastSyncError: extension.lastSyncError,
	githubOwner: githubCodeSource.owner,
	githubRepo: githubCodeSource.repo
};

export const load: PageServerLoad = async ({ platform, locals, url, cookies }) => {
	await requireAuth(url, cookies, platform!, locals);

	const db = getDatabase(platform);

	if (isRegistryAdmin(locals, platform!)) {
		const extensions = await db
			.select(extensionFields)
			.from(extension)
			.leftJoin(githubCodeSource, eq(githubCodeSource.extensionId, extension.id))
			.orderBy(desc(extension.updatedAt));
		return { extensions };
	}

	const token = locals.session!.githubToken;
	if (!token) return { extensions: [] };

	return await withReauth(platform!, locals, cookies, url, async () => {
		const pushRepoIds = await getUserPushRepoIds(token);
		if (pushRepoIds.size === 0) return { extensions: [] };

		const extensions = await db
			.select(extensionFields)
			.from(extension)
			.leftJoin(githubCodeSource, eq(githubCodeSource.extensionId, extension.id))
			.where(inArray(githubCodeSource.repoId, [...pushRepoIds]))
			.orderBy(desc(extension.updatedAt));
		return { extensions };
	});
};
