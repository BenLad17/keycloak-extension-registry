import {
	bigint,
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
	githubId: integer('github_id').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

const extensionCategories = ['authentication', 'user_federation'] as const;

export const extension = pgTable(
	'extension',
	{
		id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
		slug: text('slug').notNull().unique(),
		name: text('name').notNull().unique(),
		description: text('description'),
		category: text('category', { enum: extensionCategories }).notNull(),

		// GitHub reference - use both ID (stable) and path (human-readable owner/name)
		githubRepoId: bigint('github_repo_id', { mode: 'number' }).notNull().unique(),
		githubRepoOwner: text('github_repo_owner').notNull(),
		githubRepoName: text('github_repo_name').notNull(),

		ownerId: integer('owner_id').references(() => user.id),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),

		lastSyncedAt: timestamp('last_synced_at'),
		lastSyncError: text('last_sync_error'),
		status: text('status').default('active'), // 'pending', 'active', 'archived'

		downloadCount: integer('download_count').default(0)
	},
	(table) => [
		uniqueIndex('github_repo_id_idx').on(table.githubRepoId),
		uniqueIndex('github_repo_owner_name_idx').on(table.githubRepoOwner, table.githubRepoName),
		index('owner_idx').on(table.ownerId)
	]
);

export const extensionVersion = pgTable(
	'extension_version',
	{
		id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
		extensionId: integer('extension_id')
			.references(() => extension.id, { onDelete: 'cascade' })
			.notNull(),
		version: text('version').notNull(),
		keycloakVersion: text(),
		downloadUrl: text('download_url').notNull(),
		downloadSize: bigint('download_size', { mode: 'number' }).notNull(),
		releaseNotes: text('release_notes'),
		deprecated: boolean('deprecated').default(false),
		downloadCount: integer('download_count').default(0),
		publishedAt: timestamp('published_at').defaultNow().notNull(),
		digest: text('digest').notNull()
	},
	(table) => [
		uniqueIndex('version_idx').on(table.extensionId, table.version),
		index('extension_idx').on(table.extensionId)
	]
);

// ============================================================================
// Type exports
// ============================================================================
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Extension = typeof extension.$inferSelect;
export type NewExtension = typeof extension.$inferInsert;
export type ExtensionVersion = typeof extensionVersion.$inferSelect;
export type NewExtensionVersion = typeof extensionVersion.$inferInsert;
export type ExtensionCategory = (typeof extensionCategories)[number];

export const ExtensionCategoryLabel: Record<ExtensionCategory, string> = {
	authentication: 'Authentication',
	user_federation: 'User Federation'
};