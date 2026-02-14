/**
 * Database connection for Cloudflare Workers
 *
 * IMPORTANT: In Cloudflare Workers, we can't use global database connections.
 * Each request must create its own connection using platform.env bindings.
 *
 * For production: Uses Hyperdrive (connection pooling)
 * For local dev: Uses DATABASE_URL from process.env
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

export type Database = ReturnType<typeof createDatabase>;

/**
 * Create a database connection
 */
export function createDatabase(connectionString: string) {
	const client = postgres(connectionString, {
		prepare: false,
		max: 1
	});

	return drizzle(client, { schema });
}

// Cached connection for local dev (not in Workers!)
let localDb: Database | null = null;

/**
 * Helper to get database in request handlers
 *
 * @example
 * export const GET: RequestHandler = async ({ platform }) => {
 *   const db = getDatabase(platform);
 *   const extensions = await db.select().from(schema.extensions);
 *   return json(extensions);
 * };
 */
export function getDatabase(platform: App.Platform | undefined) {
	// Production: Use Hyperdrive
	if (platform?.env?.HYPERDRIVE?.connectionString) {
		return createDatabase(platform.env.HYPERDRIVE.connectionString);
	}

	// Local development: Use DATABASE_URL from .env
	const dbUrl = env.DATABASE_URL;
	if (dbUrl) {
		if (!localDb) {
			localDb = createDatabase(dbUrl);
		}
		return localDb;
	}

	throw new Error('No database connection available. Set DATABASE_URL in .env');
}

// Re-export schema for convenience
export * from './schema';
