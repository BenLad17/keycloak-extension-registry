import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { and, eq, sql } from 'drizzle-orm';

export async function incrementDownloadCount(
	slug: string,
	version: string,
	platform: App.Platform | undefined
): Promise<void> {
	const db = getDatabase(platform);

	const [ext] = await db
		.select({ id: extension.id })
		.from(extension)
		.where(eq(extension.slug, slug))
		.limit(1);
	if (!ext) return;

	const [ver] = await db
		.select({ id: extensionVersion.id })
		.from(extensionVersion)
		.where(and(eq(extensionVersion.extensionId, ext.id), eq(extensionVersion.version, version)))
		.limit(1);
	if (!ver) return;

	await Promise.all([
		db
			.update(extensionVersion)
			.set({ downloadCount: sql`${extensionVersion.downloadCount} + 1` })
			.where(eq(extensionVersion.id, ver.id)),
		db
			.update(extension)
			.set({ downloadCount: sql`${extension.downloadCount} + 1` })
			.where(eq(extension.id, ext.id))
	]);
}
