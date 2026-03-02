/**
 * TypeScript mirror of tools/ker-provider-fetcher/internal/config/types.go
 * Keep in sync when changing the Go types.
 */
export interface ProviderEntry {
	name: string;
	version: string;
	sha256?: string;
}

export interface ProvidersConfig {
	registry_url?: string;
	providers: ProviderEntry[];
}

export function generateYamlSnippet(entry: ProviderEntry, registryUrl: string): string {
	const lines = [
		`registry_url: ${registryUrl}`,
		`providers:`,
		`  - name: ${entry.name}`,
		`    version: "${entry.version}"`
	];
	if (entry.sha256) lines.push(`    sha256: "${entry.sha256}"`);
	return lines.join('\n');
}
