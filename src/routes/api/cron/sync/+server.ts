import type { RequestHandler } from '@sveltejs/kit';
import { extension, getDatabase } from '$lib/server/db';
import { getEnv } from '$lib/server/env';
import { syncExtension } from '$lib/server/extensions/sync';
import { eq, sql } from 'drizzle-orm';

const BATCH_SIZE = 5;

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = getEnv(platform);
	if (request.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	const db = getDatabase(platform);

	// Pick the BATCH_SIZE active extensions that were synced least recently (never-synced first).
	// Spreading the work across multiple extensions per run keeps sync lag low as the registry grows.
	const extensions = await db
		.select()
		.from(extension)
		.where(eq(extension.status, 'active'))
		.orderBy(sql`${extension.lastSyncedAt} ASC NULLS FIRST`)
		.limit(BATCH_SIZE);

	if (extensions.length === 0) {
		return Response.json({ ok: true, synced: [] });
	}

	for (const ext of extensions) {
		platform?.ctx.waitUntil(syncExtension(ext, platform!));
	}

	return Response.json({ ok: true, synced: extensions.map((e) => e.slug) });
};
