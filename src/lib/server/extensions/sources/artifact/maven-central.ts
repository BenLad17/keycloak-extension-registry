import {
	extensionVersion,
	extensionVersionFile,
	mavenArtifactSource,
	getDatabase
} from '$lib/server/db';
import { extractResourceFiles, extractPomXml, MAX_JAR_BYTES, sha256Hex } from '$lib/server/extensions/jar';
import { extractSourceFiles } from '$lib/server/extensions/source';
import { parseKeycloakVersion } from '$lib/server/extensions/pom';
import { and, eq } from 'drizzle-orm';
import type { ArtifactSourceAdapter } from '../types';

const MAVEN_BASE = 'https://repo1.maven.org/maven2';

export class MavenCentralArtifactAdapter implements ArtifactSourceAdapter {
	async discoverVersions(extensionId: number, platform: App.Platform): Promise<void> {
		const db = getDatabase(platform);

		const [source] = await db
			.select()
			.from(mavenArtifactSource)
			.where(eq(mavenArtifactSource.extensionId, extensionId))
			.limit(1);

		if (!source) {
			throw new Error(`No Maven artifact source configured for extension ${extensionId}`);
		}

		const groupPath = source.groupId.replace(/\./g, '/');
		const metadataUrl = `${MAVEN_BASE}/${groupPath}/${source.artifactId}/maven-metadata.xml`;

		const metadataResponse = await fetch(metadataUrl);
		if (!metadataResponse.ok) {
			throw new Error(
				`Failed to fetch Maven metadata from ${metadataUrl}: ${metadataResponse.status}`
			);
		}

		const versions = parseVersions(await metadataResponse.text());

		for (const version of versions) {
			const [existing] = await db
				.select()
				.from(extensionVersion)
				.where(
					and(eq(extensionVersion.extensionId, extensionId), eq(extensionVersion.version, version))
				)
				.limit(1);

			// Check if files already synced
			if (existing) {
				const [fileRow] = await db
					.select({ id: extensionVersionFile.id })
					.from(extensionVersionFile)
					.where(eq(extensionVersionFile.versionId, existing.id))
					.limit(1);
				if (fileRow) continue;
			}

			const base = `${MAVEN_BASE}/${groupPath}/${source.artifactId}/${version}/${source.artifactId}-${version}`;

			// Check Content-Length before downloading to protect Worker memory.
			const headResponse = await fetch(`${base}.jar`, { method: 'HEAD' });
			const contentLength = Number(headResponse.headers.get('Content-Length') ?? 0);
			if (contentLength > MAX_JAR_BYTES) {
				console.error(
					`JAR for Maven ${source.groupId}:${source.artifactId}:${version} exceeds size limit (${contentLength} bytes)`
				);
				continue;
			}

			// Download binary JAR
			const jarResponse = await fetch(`${base}.jar`);
			if (!jarResponse.ok) {
				console.error(
					`Failed to fetch JAR for Maven ${source.groupId}:${source.artifactId}:${version}`
				);
				continue;
			}
			const jarBytes = new Uint8Array(await jarResponse.arrayBuffer());
			const keycloakVersion = parseKeycloakVersion(extractPomXml(jarBytes) ?? '') ?? undefined;

			// Download sources JAR (Sonatype requires this for Central publication)
			const sourcesResponse = await fetch(`${base}-sources.jar`);

			const resourceFiles = extractResourceFiles(jarBytes);
			const sourceFiles = sourcesResponse.ok
				? extractSourceFiles(new Uint8Array(await sourcesResponse.arrayBuffer()))
				: [];

			const allFiles = [...resourceFiles, ...sourceFiles];

			if (existing) {
				await db
					.update(extensionVersion)
					.set({ keycloakVersion })
					.where(eq(extensionVersion.id, existing.id));

				console.log(
					`Backfilling files for Maven ${source.artifactId}:${version} of extension ${extensionId}`
				);
				if (allFiles.length > 0) {
					await db
						.insert(extensionVersionFile)
						.values(
							allFiles.map((f) => ({ versionId: existing.id, path: f.path, content: f.content }))
						);
				}
				continue;
			}

			const digest = await sha256Hex(jarBytes);

			console.log(`Found new Maven version ${version} for extension ${extensionId}`);

			const [inserted] = await db
				.insert(extensionVersion)
				.values({
					extensionId,
					version,
					downloadUrl: `${base}.jar`,
					downloadSize: jarBytes.byteLength,
					digest,
					keycloakVersion,
					downloadCount: 0
				})
				.returning({ id: extensionVersion.id });

			if (allFiles.length > 0) {
				await db
					.insert(extensionVersionFile)
					.values(
						allFiles.map((f) => ({ versionId: inserted.id, path: f.path, content: f.content }))
					);
			}
		}
	}
}

function parseVersions(xml: string): string[] {
	const versions: string[] = [];
	const re = /<version>([^<]+)<\/version>/g;
	let match: RegExpExecArray | null;
	while ((match = re.exec(xml)) !== null) {
		versions.push(match[1]);
	}
	return versions;
}
