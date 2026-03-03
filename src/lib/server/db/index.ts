import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type Database = ReturnType<typeof drizzle<typeof schema>>;

export function getDatabase(platform: App.Platform | undefined): Database {
	const d1 = platform?.env?.DB;
	if (!d1) throw new Error('D1 database binding not available.');
	return drizzle(d1, { schema });
}

// Re-export schema for convenience
export * from './schema';
