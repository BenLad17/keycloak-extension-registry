/**
 * Caching layer using Cloudflare KV
 *
 * Uses Cloudflare KV for distributed caching.
 * Platform bindings are available in both dev (via Miniflare) and production.
 */

/**
 * Cache interface wrapping KVNamespace
 */
export interface CacheStore {
	get(key: string): Promise<string | null>;
	set(key: string, value: string, ttlSeconds: number): Promise<void>;
	delete(key: string): Promise<void>;
}

/**
 * Create a cache store from platform bindings
 */
export function getCache(platform: App.Platform | undefined): CacheStore {
	const kv = platform?.env?.CACHE;

	if (!kv) {
		throw new Error('KV namespace CACHE not available. Make sure platform bindings are configured.');
	}

	return {
		async get(key: string) {
			return kv.get(key);
		},
		async set(key: string, value: string, ttlSeconds: number) {
			await kv.put(key, value, { expirationTtl: ttlSeconds });
		},
		async delete(key: string) {
			await kv.delete(key);
		}
	};
}


// =============================================================================
// Cache Keys
// =============================================================================

export const CacheKeys = {
	/** GitHub user profile by ID */
	githubUser: (githubId: number) => `github:user:${githubId}`,

	/** GitHub installation token (short TTL) */
	installationToken: (installationId: number) => `github:token:${installationId}`,
} as const;

// =============================================================================
// Cache TTLs (in seconds)
// =============================================================================

export const CacheTTL = {
	/** GitHub user profiles - 5 minutes */
	GITHUB_USER: 5 * 60,

	/** Installation tokens - 50 minutes (they expire after 1 hour) */
	INSTALLATION_TOKEN: 50 * 60,
} as const;

