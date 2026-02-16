import { type RequestHandler } from '@sveltejs/kit';
import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';

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

	return fetch(downloadVersion.downloadUrl, {
		cf: {
			cache: 'no-store'
		}
	});
};
