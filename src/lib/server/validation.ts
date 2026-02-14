/**
 * Zod validation schemas for API requests
 */

import { z } from 'zod';
import { EXTENSION_CATEGORIES } from '$lib/shared/types';

// =============================================================================
// Common patterns
// =============================================================================

export const semverSchema = z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid semver format');

export const slugSchema = z
	.string()
	.min(1)
	.max(100)
	.regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens');

export const githubRepoSchema = z
	.string()
	.regex(/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/, 'Invalid GitHub repo format (owner/repo)');

// =============================================================================
// Keycloak Compatibility
// =============================================================================

export const keycloakCompatibilitySchema = z.object({
	min: semverSchema,
	max: semverSchema,
	tested: z.array(semverSchema).optional()
});

// =============================================================================
// Extension Manifest (from repo)
// =============================================================================

export const buildConfigSchema = z.object({
	type: z.literal('github-release'),
	assetName: z.string().optional()
});

export const versionConfigSchema = z.object({
	keycloakCompatibility: keycloakCompatibilitySchema.optional(),
	releaseNotes: z.string().optional(),
	deprecated: z.boolean().optional(),
	deprecationMessage: z.string().optional()
});

// Category enum for Zod
const categoryEnum = z.enum([
	'Authentication',
	'Authorization',
	'User Federation',
	'Events & Logging',
	'Themes',
	'Metrics & Monitoring',
	'Storage',
	'Admin API',
	'Other'
]);

export const extensionManifestSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().min(10).max(500),
	author: z.string().optional(),
	homepage: z.string().url().optional(),
	license: z.string().optional(),
	categories: z.array(categoryEnum).optional(),
	tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).optional(),
	build: buildConfigSchema,
	keycloakCompatibility: keycloakCompatibilitySchema,
	versions: z.record(z.string(), versionConfigSchema).optional()
});

// =============================================================================
// API Request schemas
// =============================================================================

export const registerExtensionSchema = z.object({
	githubRepo: githubRepoSchema
});

export const searchExtensionsSchema = z.object({
	q: z.string().optional(),
	category: categoryEnum.optional(),
	kc: semverSchema.optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20)
});

// =============================================================================
// Type exports from schemas
// =============================================================================

export type ExtensionManifestInput = z.infer<typeof extensionManifestSchema>;
export type VersionConfigInput = z.infer<typeof versionConfigSchema>;
export type RegisterExtensionInput = z.infer<typeof registerExtensionSchema>;
export type SearchExtensionsInput = z.infer<typeof searchExtensionsSchema>;

