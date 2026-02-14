/**
 * API: GET /api/extensions/[name]/[version]
 * Download JAR file or get version info
 */

import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase, extensions, versions } from '$lib/server/db';
import { eq, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, platform, url }) => {
	const { name, version } = params;
	const db = getDatabase(platform);

	// Get extension
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.slug, name))
		.limit(1);

	if (!extension) {
		throw error(404, 'Extension not found');
	}

	// Get version
	const [versionData] = await db
		.select()
		.from(versions)
		.where(and(eq(versions.extensionId, extension.id), eq(versions.version, version)))
		.limit(1);

	if (!versionData) {
		throw error(404, 'Version not found');
	}

	// Check if download requested
	const isDownload = url.pathname.endsWith('/download');

	if (isDownload) {
		// Increment download counters (fire and forget)
		platform?.ctx.waitUntil(
			Promise.all([
				db
					.update(versions)
					.set({ downloadCount: sql`${versions.downloadCount} + 1` })
					.where(eq(versions.id, versionData.id)),
				db
					.update(extensions)
					.set({ downloadCount: sql`${extensions.downloadCount} + 1` })
					.where(eq(extensions.id, extension.id))
			])
		);

		// Redirect to JAR URL (R2)
		return new Response(null, {
			status: 302,
			headers: {
				Location: versionData.jarUrl
			}
		});
	}

	// Return version info
	return new Response(
		JSON.stringify({
			version: versionData.version,
			keycloakCompatibility: versionData.keycloakCompatibility,
			jarUrl: versionData.jarUrl,
			sha256: versionData.sha256,
			size: versionData.jarSize,
			publishedAt: versionData.publishedAt,
			deprecated: versionData.deprecated,
			releaseNotes: versionData.releaseNotes
		}),
		{
			headers: { 'Content-Type': 'application/json' }
		}
	);
};
