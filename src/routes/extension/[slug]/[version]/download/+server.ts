import { type RequestHandler } from '@sveltejs/kit';
import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { incrementDownloadCount } from '$lib/server/extensions/downloads';

export const GET: RequestHandler = async ({ platform, params }) => {
	const slug = params.slug;
	const version = params.version;
	if (!slug || !version || slug.length > 100 || version.length > 50) {
		return new Response(null, { status: 400 });
	}

	const db = getDatabase(platform);

	const [ext] = await db
		.select({ id: extension.id })
		.from(extension)
		.where(eq(extension.slug, slug))
		.limit(1);
	if (!ext) {
		return new Response('Extension not found', { status: 404 });
	}

	const [ver] = await db
		.select({ downloadUrl: extensionVersion.downloadUrl })
		.from(extensionVersion)
		.where(and(eq(extensionVersion.extensionId, ext.id), eq(extensionVersion.version, version)))
		.limit(1);
	if (!ver) {
		return new Response('Version not found', { status: 404 });
	}

	platform?.ctx.waitUntil(incrementDownloadCount(slug, version, platform));

	return new Response(null, { status: 302, headers: { Location: ver.downloadUrl } });
};
