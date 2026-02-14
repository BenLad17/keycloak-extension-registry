/**
 * Environment variables helper
 *
 * In both production and local dev (with wrangler): Uses platform.env
 * All bindings (KV, R2, Hyperdrive) and secrets are provided by wrangler.
 */

/**
 * Get environment from platform
 * Throws if platform is not available (should not happen with wrangler)
 */
export function getEnv(platform: App.Platform | undefined): Env {
	if (!platform?.env) {
		throw new Error('Platform environment not available. Are you running with wrangler?');
	}
	return platform.env;
}
