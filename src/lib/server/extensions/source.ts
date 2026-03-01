import { unzipSync } from 'fflate';

const MAX_CONTENT_BYTES = 200_000;

/**
 * Extract Java source files from a ZIP archive (GitHub zipball or Maven sources JAR).
 *
 * GitHub zipballs wrap everything under a single "{owner}-{repo}-{sha}/" prefix —
 * this is detected automatically and stripped so stored paths are relative to the
 * repo root (e.g. "src/main/java/com/example/Foo.java").
 *
 * Maven sources JARs have package paths at the root (e.g. "com/example/Foo.java")
 * and need no stripping.
 */
export function extractSourceFiles(bytes: Uint8Array): { path: string; content: string }[] {
	const unzipped = unzipSync(bytes);
	const entries = Object.entries(unzipped).filter(([p]) => !p.endsWith('/'));

	// Detect a single top-level directory prefix (GitHub zipball pattern)
	const topDirs = new Set(entries.map(([p]) => p.split('/')[0]));
	const stripPrefix = topDirs.size === 1;

	const results: { path: string; content: string }[] = [];

	for (const [rawPath, data] of entries) {
		if (!rawPath.endsWith('.java')) continue;
		if (data.length > MAX_CONTENT_BYTES) continue;

		const path = stripPrefix ? rawPath.slice(rawPath.indexOf('/') + 1) : rawPath;
		if (!path) continue;

		try {
			const content = new TextDecoder('utf-8', { fatal: true }).decode(data);
			results.push({ path, content });
		} catch {
			// Not valid UTF-8 — skip
		}
	}

	return results.sort((a, b) => a.path.localeCompare(b.path));
}
