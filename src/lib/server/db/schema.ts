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

		codeSourceType: text('code_source_type', { enum: ['github'] }).notNull(),

		ownerId: integer('owner_id').references(() => user.id),

		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),

		readme: text('readme'),

		lastSyncedAt: timestamp('last_synced_at'),
		lastSyncError: text('last_sync_error'),
		status: text('status').default('active'), // 'pending', 'active', 'archived'

		downloadCount: integer('download_count').default(0)
	},
	(table) => [index('owner_idx').on(table.ownerId)]
);

export const githubCodeSource = pgTable('github_code_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	repoId: bigint('repo_id', { mode: 'number' }).notNull().unique(),
	owner: text('owner').notNull(),
	repo: text('repo').notNull()
});

export const githubArtifactSource = pgTable('github_artifact_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	owner: text('owner').notNull(),
	repo: text('repo').notNull()
});

export const mavenArtifactSource = pgTable('maven_artifact_source', {
	extensionId: integer('extension_id')
		.primaryKey()
		.references(() => extension.id, { onDelete: 'cascade' }),
	groupId: text('group_id').notNull(),
	artifactId: text('artifact_id').notNull()
});

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

export const extensionVersionFile = pgTable(
	'extension_version_file',
	{
		id: integer('id').generatedAlwaysAsIdentity().primaryKey(),
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

export const ExtensionCategoryLabel: Record<ExtensionCategory, string> = {
	authentication: 'Authentication',
	user_federation: 'User Federation'
};
