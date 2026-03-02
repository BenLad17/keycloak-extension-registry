import { unzipSync } from 'fflate';

const MAX_CONTENT_BYTES = 100_000;

export const MAX_JAR_BYTES = 50 * 1024 * 1024; // 50 MB

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

const TEXT_EXTENSIONS = new Set([
	'.xml',
	'.xsd',
	'.xhtml',
	'.json',
	'.properties',
	'.MF',
	'.SF',
	'.ftl',
	'.html',
	'.htm',
	'.txt',
	'.yaml',
	'.yml',
	'.css',
	'.js',
	'.md'
]);

function isResourceFile(path: string): boolean {
	if (path.endsWith('.class')) return false;
	if (path.startsWith('META-INF/services/') && !path.endsWith('/')) return true;
	const dot = path.lastIndexOf('.');
	if (dot === -1) return false;
	return TEXT_EXTENSIONS.has(path.substring(dot));
}

/**
 * Extract the embedded pom.xml from a JAR (Maven always bundles it at
 * META-INF/maven/{groupId}/{artifactId}/pom.xml).
 * Returns the raw XML string, or null if not found.
 */
export function extractPomXml(bytes: Uint8Array): string | null {
	let unzipped: ReturnType<typeof unzipSync>;
	try {
		unzipped = unzipSync(bytes);
	} catch {
		return null;
	}
	for (const [path, data] of Object.entries(unzipped)) {
		if (path.startsWith('META-INF/maven/') && path.endsWith('/pom.xml')) {
			try {
				return new TextDecoder('utf-8', { fatal: true }).decode(data);
			} catch {
				return null;
			}
		}
	}
	return null;
}

/**
 * Extract readable resource files from a JAR (ZIP).
 * Skips .class files and anything that can't be decoded as UTF-8.
 */
export function extractResourceFiles(bytes: Uint8Array): { path: string; content: string }[] {
	let unzipped: ReturnType<typeof unzipSync>;
	try {
		unzipped = unzipSync(bytes);
	} catch {
		return [];
	}
	const results: { path: string; content: string }[] = [];

	for (const [path, data] of Object.entries(unzipped)) {
		if (path.endsWith('/')) continue;
		if (!isResourceFile(path)) continue;
		if (data.length > MAX_CONTENT_BYTES) continue;

		try {
			const content = new TextDecoder('utf-8', { fatal: true }).decode(data);
			results.push({ path, content });
		} catch {
			// Not valid UTF-8 - skip
		}
	}

	return results.sort((a, b) => a.path.localeCompare(b.path));
}
