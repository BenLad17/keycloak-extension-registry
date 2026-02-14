import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	boolean,
	jsonb,
	uniqueIndex,
	index,
	bigint
} from 'drizzle-orm/pg-core';

// ============================================================================
// Users - GitHub authenticated users
// ============================================================================
// We only store the minimal data needed to identify users.
// Profile data (username, email, avatar) is fetched from GitHub when needed.
export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		githubId: integer('github_id').notNull().unique(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [uniqueIndex('github_id_idx').on(table.githubId)]
);

// ============================================================================
// Extensions - Main extension metadata
// ============================================================================
export const extensions = pgTable(
	'extensions',
	{
		id: serial('id').primaryKey(),
		slug: text('slug').notNull().unique(), // Immutable after creation
		name: text('name').notNull(), // From manifest, can change
		description: text('description'),

		// GitHub reference - use both ID (stable) and path (human readable)
		githubRepoId: bigint('github_repo_id', { mode: 'number' }).notNull().unique(), // Stable GitHub repo ID
		githubRepo: text('github_repo').notNull(), // Cached "owner/repo" path, updated on sync

		ownerId: integer('owner_id')
			.references(() => users.id)
			.notNull(),
		homepage: text('homepage'),
		license: text('license'),
		category: text('category').default('Other'),
		downloadCount: integer('download_count').default(0),
		lastSyncedAt: timestamp('last_synced_at'),
		lastSyncError: text('last_sync_error'),
		status: text('status').default('active'), // 'pending', 'active', 'archived'
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('slug_idx').on(table.slug),
		uniqueIndex('github_repo_id_idx').on(table.githubRepoId),
		index('github_repo_idx').on(table.githubRepo),
		index('owner_idx').on(table.ownerId)
	]
);

// ============================================================================
// Versions - Extension versions with KC compatibility
// ============================================================================
export const versions = pgTable(
	'versions',
	{
		id: serial('id').primaryKey(),
		extensionId: integer('extension_id')
			.references(() => extensions.id, { onDelete: 'cascade' })
			.notNull(),
		version: text('version').notNull(),
		keycloakCompatibility: jsonb('keycloak_compatibility').notNull(),
		jarUrl: text('jar_url').notNull(),
		jarSize: integer('jar_size'),
		sha256: text('sha256').notNull(),
		githubReleaseTag: text('github_release_tag'),
		githubReleaseUrl: text('github_release_url'),
		releaseNotes: text('release_notes'),
		deprecated: boolean('deprecated').default(false),
		deprecationMessage: text('deprecation_message'),
		downloadCount: integer('download_count').default(0),
		publishedAt: timestamp('published_at').defaultNow().notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('version_idx').on(table.extensionId, table.version),
		index('extension_idx').on(table.extensionId)
	]
);

// ============================================================================
// Tags
// ============================================================================
export const tags = pgTable(
	'tags',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull().unique(),
		description: text('description')
	},
	(table) => [uniqueIndex('tag_name_idx').on(table.name)]
);

// ============================================================================
// Extension Tags - Many-to-many
// ============================================================================
export const extensionTags = pgTable(
	'extension_tags',
	{
		extensionId: integer('extension_id')
			.references(() => extensions.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: integer('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => [uniqueIndex('extension_tag_pk').on(table.extensionId, table.tagId)]
);

// ============================================================================
// Categories
// ============================================================================
export const CATEGORIES = [
	'Authentication',
	'Authorization',
	'User Federation',
	'Events & Logging',
	'Themes',
	'Metrics & Monitoring',
	'Storage',
	'Admin API',
	'Other'
] as const;

export type Category = (typeof CATEGORIES)[number];

// ============================================================================
// Type exports
// ============================================================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Extension = typeof extensions.$inferSelect;
export type NewExtension = typeof extensions.$inferInsert;
export type Version = typeof versions.$inferSelect;
export type NewVersion = typeof versions.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;

export interface KeycloakCompatibility {
	min: string;
	max: string;
	tested?: string[];
}
