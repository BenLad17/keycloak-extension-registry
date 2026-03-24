/**
 * Pure, client-safe install snippet generators.
 * Do NOT import from $lib/server/ — this file is safe to use in both
 * server and client contexts.
 */

export function mavenDependencySnippet(
	groupId: string,
	artifactId: string,
	version: string
): string {
	return `<dependency>\n  <groupId>${groupId}</groupId>\n  <artifactId>${artifactId}</artifactId>\n  <version>${version}</version>\n</dependency>`;
}

export function yamlManifestSnippet(groupId: string, artifactId: string, version: string): string {
	return `- groupId: ${groupId}\n  artifactId: ${artifactId}\n  version: ${version}`;
}

export function initContainerSnippet(
	groupId: string,
	artifactId: string,
	version: string,
	imageRef: string
): string {
	return [
		`# Add this entry to your keycloak-extensions.yaml ConfigMap:`,
		`# - groupId: ${groupId}`,
		`#   artifactId: ${artifactId}`,
		`#   version: ${version}`,
		`- name: install-extensions`,
		`  image: ${imageRef}`,
		`  args: ["--manifest", "/manifests/keycloak-extensions.yaml", "--target", "/opt/keycloak/providers"]`,
		`  volumeMounts:`,
		`    - name: providers`,
		`      mountPath: /opt/keycloak/providers`,
		`    - name: extensions-manifest`,
		`      mountPath: /manifests`
	].join('\n');
}
