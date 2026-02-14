/**
 * Shared types for keycloak-extension.yaml manifest files
 *
 * Used by:
 * - Registry API (validation)
 * - Builder (parsing)
 * - Frontend (display)
 */

// =============================================================================
// Keycloak Compatibility
// =============================================================================

/**
 * Keycloak version compatibility range
 */
export interface KeycloakCompatibility {
	/** Minimum supported Keycloak version (e.g., "24.0.0") */
	min: string;
	/** Maximum supported Keycloak version (e.g., "27.0.0") */
	max: string;
	/** List of tested/verified Keycloak versions */
	tested?: string[];
}

// =============================================================================
// Extension Manifest (in extension repo: keycloak-extension.yaml)
// =============================================================================

/**
 * Build configuration for the extension
 */
export interface BuildConfig {
	/**
	 * Build type
	 * - github-release: Download JAR from GitHub Release assets
	 */
	type: 'github-release';

	/**
	 * Asset name pattern for github-release type
	 * Use {version} as placeholder for the version number
	 * Example: "keycloak-metrics-spi-{version}.jar"
	 */
	assetName?: string;
}

/**
 * Version-specific configuration
 */
export interface VersionConfig {
	/** Keycloak compatibility for this specific version */
	keycloakCompatibility?: KeycloakCompatibility;
	/** Release notes for this version */
	releaseNotes?: string;
	/** Whether this version is deprecated */
	deprecated?: boolean;
	/** Deprecation message shown to users */
	deprecationMessage?: string;
}

/**
 * Extension Manifest Schema (keycloak-extension.yaml)
 *
 * This file lives in the extension's GitHub repository
 * and serves as the Single Source of Truth for extension metadata.
 */
export interface ExtensionManifest {
	/** Extension name (unique identifier) */
	name: string;
	/** Short description (max 200 chars) */
	description: string;
	/** Author name or organization */
	author?: string;
	/** Homepage URL */
	homepage?: string;
	/** License identifier (e.g., "Apache-2.0", "MIT") */
	license?: string;
	/** Categories for filtering */
	categories?: ExtensionCategory[];
	/** Tags for search */
	tags?: string[];
	/** Build configuration */
	build: BuildConfig;
	/** Default Keycloak compatibility */
	keycloakCompatibility: KeycloakCompatibility;
	/** Version-specific configurations */
	versions?: Record<string, VersionConfig>;
}

// =============================================================================
// User Config (extensions.yaml - used by builder)
// =============================================================================

/**
 * User's extension configuration file (extensions.yaml)
 */
export interface ExtensionsConfig {
	/** Registry URL (optional) */
	registry?: string;
	/** List of extensions to install */
	extensions: ExtensionReference[];
}

/**
 * Reference to an extension to install
 */
export interface ExtensionReference {
	/** Extension name (as registered in the registry) */
	name: string;
	/** Version to install ("5.0.0" or "latest") */
	version: string;
}

// =============================================================================
// Categories
// =============================================================================

export type ExtensionCategory =
	| 'Authentication'
	| 'Authorization'
	| 'User Federation'
	| 'Events & Logging'
	| 'Themes'
	| 'Metrics & Monitoring'
	| 'Storage'
	| 'Admin API'
	| 'Other';

export const EXTENSION_CATEGORIES: ExtensionCategory[] = [
	'Authentication',
	'Authorization',
	'User Federation',
	'Events & Logging',
	'Themes',
	'Metrics & Monitoring',
	'Storage',
	'Admin API',
	'Other'
];

// =============================================================================
// Validation helpers
// =============================================================================

export const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

export function isValidSemver(version: string): boolean {
	return SEMVER_PATTERN.test(version);
}

export function isValidExtensionName(name: string): boolean {
	return /^[a-z0-9-]+\/[a-z0-9-]+$|^[a-z0-9-]+$/.test(name);
}

