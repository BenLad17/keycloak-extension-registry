/**
 * Helpers for generating provider image references and Dockerfile snippets.
 */

export function providerImageRef(base: string, slug: string, version: string): string {
	return `${base}/${slug}:${version}`;
}

export function generateCopyLine(imageRef: string): string {
	return `COPY --from=${imageRef} /providers/ /opt/keycloak/providers/`;
}

