/**
 * Database connection for Cloudflare Workers
 */

import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import {env} from '$env/dynamic/private';

export type Database = ReturnType<typeof drizzle<typeof schema>>;


let client: ReturnType<typeof postgres> | null = null;
let db: Database | null = null;

/**
 * Get or create the database connection (singleton)
 */
export function getDatabase(platform: App.Platform | undefined): Database {
    // Return cached instance if available
    if (db && client) {
        return db;
    }

    // Determine connection string
    const connectionString = platform?.env?.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;

    if (!connectionString) {
        throw new Error('No database connection available. Set DATABASE_URL in .env or configure Hyperdrive');
    }

    client = postgres(connectionString, {
        prepare: false,
        max: 10,
        idle_timeout: 30,
        connect_timeout: 10
    });

    db = drizzle(client, {schema});

    return db;
}

// Re-export schema for convenience
export * from './schema';
