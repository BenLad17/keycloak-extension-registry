export interface PomMetadata {
	name: string | null;
	description: string | null;
	url: string | null;
	licenseName: string | null;
	licenseUrl: string | null;
	scmUrl: string | null;
	developers: {
		name: string | null;
		email: string | null;
		org: string | null;
		orgUrl: string | null;
	}[];
}

/**
 * Parse metadata fields from a Maven pom.xml string.
 *
 * Extracts: name, description, project URL, license (name + URL), SCM URL, and developers.
 * All fields are optional — absent fields return null (or [] for developers).
 * Uses the same hand-rolled regex approach as parseKeycloakVersion().
 */
export function parsePomMetadata(xml: string): PomMetadata {
	const properties = parseProperties(xml);

	// --- name ---
	const nameMatch = xml.match(/<name>([^<]+)<\/name>/);
	const rawName = nameMatch ? nameMatch[1].trim() : null;
	const name = rawName ? (resolveProperty(rawName, properties) ?? rawName) : null;

	// --- description ---
	const descMatch = xml.match(/<description>([^<]+)<\/description>/);
	const description = descMatch ? descMatch[1].trim() : null;

	// --- license (from first <license> block inside <licenses>) ---
	let licenseName: string | null = null;
	let licenseUrl: string | null = null;
	const licensesBlockMatch = xml.match(/<licenses>([\s\S]*?)<\/licenses>/);
	if (licensesBlockMatch) {
		const licenseBlock = licensesBlockMatch[1].match(/<license>([\s\S]*?)<\/license>/);
		if (licenseBlock) {
			const lnMatch = licenseBlock[1].match(/<name>([^<]+)<\/name>/);
			licenseName = lnMatch ? lnMatch[1].trim() : null;
			const luMatch = licenseBlock[1].match(/<url>([^<]+)<\/url>/);
			licenseUrl = luMatch ? luMatch[1].trim() : null;
		}
	}

	// --- scm url ---
	let scmUrl: string | null = null;
	const scmBlockMatch = xml.match(/<scm>([\s\S]*?)<\/scm>/);
	if (scmBlockMatch) {
		// Prefer human-readable <url> over <connection> (which has scm:git://... prefix)
		const scmUrlMatch = scmBlockMatch[1].match(/<url>([^<]+)<\/url>/);
		scmUrl = scmUrlMatch ? scmUrlMatch[1].trim() : null;
		if (!scmUrl) {
			const connMatch = scmBlockMatch[1].match(/<connection>([^<]+)<\/connection>/);
			scmUrl = connMatch ? connMatch[1].trim() : null;
		}
	}

	// --- top-level project url ---
	// Strip nested blocks that may contain their own <url> tags before matching,
	// to avoid picking up URLs from <scm>, <licenses>, <distributionManagement>, or <repositories>.
	const stripped = xml
		.replace(/<scm>[\s\S]*?<\/scm>/g, '')
		.replace(/<licenses>[\s\S]*?<\/licenses>/g, '')
		.replace(/<distributionManagement>[\s\S]*?<\/distributionManagement>/g, '')
		.replace(/<repositories>[\s\S]*?<\/repositories>/g, '')
		.replace(/<pluginRepositories>[\s\S]*?<\/pluginRepositories>/g, '');
	const urlMatch = stripped.match(/<url>([^<]+)<\/url>/);
	const rawUrl = urlMatch ? urlMatch[1].trim() : null;
	const url = rawUrl ? (resolveProperty(rawUrl, properties) ?? rawUrl) : null;

	// --- developers ---
	const developers: PomMetadata['developers'] = [];
	const devBlockRe = /<developer>([\s\S]*?)<\/developer>/g;
	let dm: RegExpExecArray | null;
	while ((dm = devBlockRe.exec(xml)) !== null) {
		const block = dm[1];
		const devName = block.match(/<name>([^<]+)<\/name>/)?.[1]?.trim() ?? null;
		const email = block.match(/<email>([^<]+)<\/email>/)?.[1]?.trim() ?? null;
		const org = block.match(/<organization>([^<]+)<\/organization>/)?.[1]?.trim() ?? null;
		const orgUrl = block.match(/<organizationUrl>([^<]+)<\/organizationUrl>/)?.[1]?.trim() ?? null;
		developers.push({ name: devName, email, org, orgUrl });
	}

	return { name, description, url, licenseName, licenseUrl, scmUrl, developers };
}

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
