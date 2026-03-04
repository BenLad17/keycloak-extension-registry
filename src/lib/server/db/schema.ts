import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { ExtensionCategoryLabel } from '../../common/extension-category';

export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	githubId: integer('github_id').notNull().unique(),
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

// Derived from the common file so categories are always in sync across server and client.
const extensionCategories = Object.keys(ExtensionCategoryLabel) as [
	keyof typeof ExtensionCategoryLabel,
	...Array<keyof typeof ExtensionCategoryLabel>
];

export const extension = sqliteTable(
	'extension',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull().unique(),
		name: text('name').notNull(),
		description: text('description'),
		category: text('category', { enum: extensionCategories }).notNull(),

		codeSourceType: text('code_source_type', { enum: ['github'] }).notNull(),

		ownerId: integer('owner_id').references(() => user.id),

		createdAt: integer('created_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),

		readme: text('readme'),

		lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
		lastSyncError: text('last_sync_error'),
		status: text('status', { enum: ['pending', 'active', 'archived'] }).default('active'),

		downloadCount: integer('download_count').default(0)
	},
	(table) => [index('owner_idx').on(table.ownerId)]
);

export const githubCodeSource = sqliteTable('github_code_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	repoId: integer('repo_id').notNull().unique(),
	owner: text('owner').notNull(),
	repo: text('repo').notNull()
});

export const githubArtifactSource = sqliteTable('github_artifact_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	repoId: integer('repo_id'),
	owner: text('owner').notNull(),
	repo: text('repo').notNull()
});

export const mavenArtifactSource = sqliteTable('maven_artifact_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	groupId: text('group_id').notNull(),
	artifactId: text('artifact_id').notNull()
});

export const extensionVersion = sqliteTable(
	'extension_version',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		extensionId: integer('extension_id')
			.references(() => extension.id, { onDelete: 'cascade' })
			.notNull(),
		version: text('version').notNull(),
		keycloakVersion: text(),
		downloadUrl: text('download_url').notNull(),
		downloadSize: integer('download_size').notNull(),
		releaseNotes: text('release_notes'),
		deprecated: integer('deprecated', { mode: 'boolean' }).default(false),
		downloadCount: integer('download_count').default(0),
		publishedAt: integer('published_at', { mode: 'timestamp' })
			.notNull()
			.$defaultFn(() => new Date()),
		digest: text('digest').notNull(),
		providerImageBuilt: integer('provider_image_built', { mode: 'boolean' })
			.notNull()
			.default(false)
	},
	(table) => [
		uniqueIndex('version_idx').on(table.extensionId, table.version),
		index('extension_idx').on(table.extensionId)
	]
);

export const extensionVersionFile = sqliteTable(
	'extension_version_file',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		versionId: integer('version_id')
			.references(() => extensionVersion.id, { onDelete: 'cascade' })
			.notNull(),
		path: text('path').notNull(),
		content: text('content').notNull()
	},
	(table) => [index('file_version_idx').on(table.versionId)]
);

// ============================================================================
// Type exports
// ============================================================================
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Extension = typeof extension.$inferSelect;
export type NewExtension = typeof extension.$inferInsert;
export type GithubCodeSource = typeof githubCodeSource.$inferSelect;
export type NewGithubCodeSource = typeof githubCodeSource.$inferInsert;
export type GithubArtifactSource = typeof githubArtifactSource.$inferSelect;
export type NewGithubArtifactSource = typeof githubArtifactSource.$inferInsert;
export type MavenArtifactSource = typeof mavenArtifactSource.$inferSelect;
export type NewMavenArtifactSource = typeof mavenArtifactSource.$inferInsert;
export type ExtensionVersion = typeof extensionVersion.$inferSelect;
export type NewExtensionVersion = typeof extensionVersion.$inferInsert;
export type ExtensionVersionFile = typeof extensionVersionFile.$inferSelect;
export type NewExtensionVersionFile = typeof extensionVersionFile.$inferInsert;
export type ExtensionCategory = (typeof extensionCategories)[number];

// Re-exported from the common file for callers that already import from $lib/server/db.
export { ExtensionCategoryLabel } from '../../common/extension-category';
