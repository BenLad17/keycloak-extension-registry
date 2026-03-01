import { type RequestHandler } from '@sveltejs/kit';
import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ platform, params }) => {
	const slug = params.slug;
	const version = params.version;
	if (!slug || !version) {
		return new Response(null, { status: 400 });
	}

	const db = getDatabase(platform);

	const [downloadExtension] = await db
		.select()
		.from(extension)
		.where(eq(extension.slug, slug))
		.limit(1);
	if (!downloadExtension) {
		return new Response('Extension not found', { status: 404 });
	}

	const [downloadVersion] = await db
		.select()
		.from(extensionVersion)
		.where(
			and(
				eq(extensionVersion.version, version),
				eq(extensionVersion.extensionId, downloadExtension.id)
			)
		)
		.limit(1);
	if (!downloadVersion) {
		return new Response('Version not found', { status: 404 });
	}

	const response = await fetch(downloadVersion.downloadUrl, {
		cf: {
			cache: 'no-store'
		}
	});

	if (response.ok) {
		platform?.ctx.waitUntil(
			Promise.all([
				db
					.update(extensionVersion)
					.set({ downloadCount: sql`${extensionVersion.downloadCount} + 1` })
					.where(eq(extensionVersion.id, downloadVersion.id)),
				db
					.update(extension)
					.set({ downloadCount: sql`${extension.downloadCount} + 1` })
					.where(eq(extension.id, downloadExtension.id))
			])
		);
	}

	return response;
};