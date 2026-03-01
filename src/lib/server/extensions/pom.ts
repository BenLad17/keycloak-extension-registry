/**
 * Parse the Keycloak version from a Maven pom.xml.
 *
 * Strategy:
 *   1. Collect all <properties> entries.
 *   2. Look for an explicit keycloak version property (keycloak.version, etc.).
 *   3. If not found, scan <dependencies> for any org.keycloak artifact and
 *      read its <version>, resolving ${property} references.
 */
export function parseKeycloakVersion(xml: string): string | null {
	const properties = parseProperties(xml);

	// Common explicit property names
	const propNames = ['keycloak.version', 'keycloak-version', 'keycloakVersion', 'version.keycloak'];
	for (const name of propNames) {
		const resolved = resolveProperty(properties[name] ?? '', properties);
		if (resolved) return resolved;
	}

	// Scan dependencies for org.keycloak artifacts
	const depRe = /<dependency>([\s\S]*?)<\/dependency>/g;
	let m: RegExpExecArray | null;
	while ((m = depRe.exec(xml)) !== null) {
		const dep = m[1];
		if (!dep.includes('<groupId>org.keycloak</groupId>')) continue;
		const versionMatch = dep.match(/<version>([^<]+)<\/version>/);
		if (!versionMatch) continue;
		const raw = versionMatch[1].trim();
		const resolved = resolveProperty(raw, properties);
		if (resolved) return resolved;
	}

	return null;
}

function parseProperties(xml: string): Record<string, string> {
	const props: Record<string, string> = {};
	const block = xml.match(/<properties>([\s\S]*?)<\/properties>/);
	if (!block) return props;
	const entryRe = /<([\w.\-]+)>([^<]*)<\/[\w.\-]+>/g;
	let m: RegExpExecArray | null;
	while ((m = entryRe.exec(block[1])) !== null) {
		props[m[1].trim()] = m[2].trim();
	}
	return props;
}

function resolveProperty(value: string, properties: Record<string, string>): string | null {
	if (!value.startsWith('${')) return value || null;
	const name = value.slice(2, -1);
	return properties[name] ?? null;
}
