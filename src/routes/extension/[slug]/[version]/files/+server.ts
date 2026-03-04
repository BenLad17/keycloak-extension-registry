import type { RequestHandler } from '@sveltejs/kit';
import { extension, extensionVersion, extensionVersionFile, getDatabase } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ platform, params }) => {
	const { slug, version } = params;
	if (!slug || !version || slug.length > 100 || version.length > 50) {
		throw error(400);
	}

	const db = getDatabase(platform);

	const [ext] = await db
		.select({ id: extension.id })
		.from(extension)
		.where(eq(extension.slug, slug))
		.limit(1);
	if (!ext) throw error(404);

	const [ver] = await db
		.select({ id: extensionVersion.id })
		.from(extensionVersion)
		.where(and(eq(extensionVersion.extensionId, ext.id), eq(extensionVersion.version, version)))
		.limit(1);
	if (!ver) throw error(404);

	const files = await db
		.select({ path: extensionVersionFile.path, content: extensionVersionFile.content })
		.from(extensionVersionFile)
		.where(eq(extensionVersionFile.versionId, ver.id))
		.orderBy(extensionVersionFile.path);

	return Response.json(files);
};
