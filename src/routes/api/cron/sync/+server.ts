import type { RequestHandler } from '@sveltejs/kit';
import { extension, getDatabase } from '$lib/server/db';
import { getEnv } from '$lib/server/env';
import { syncExtension } from '$lib/server/extensions/sync';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = getEnv(platform);
	if (request.headers.get('Authorization') !== `Bearer ${env.CRON_SECRET}`) {
		return new Response('Unauthorized', { status: 401 });
	}

	const db = getDatabase(platform);

	// Pick the active extension that was synced least recently (never-synced first).
	// This ensures one extension per cron run — no API rate-limit spikes.
	const [ext] = await db
		.select()
		.from(extension)
		.where(eq(extension.status, 'active'))
		.orderBy(sql`${extension.lastSyncedAt} ASC NULLS FIRST`)
		.limit(1);

	if (!ext) {
		return Response.json({ ok: true, synced: null });
	}

	platform?.ctx.waitUntil(syncExtension(ext, platform!));

	return Response.json({ ok: true, synced: ext.slug });
};
