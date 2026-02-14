/**
 * Sync endpoint to manually trigger syncing releases for an extension
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDatabase, extensions, versions } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import {
	getRepoReleases,
	fetchRepoFile,
	downloadReleaseAsset,
	getRepoDetails,
	getRepoInstallation,
	getInstallationAccessToken
} from '$lib/server/github';
import { parse as parseYaml } from 'yaml';
import { extensionManifestSchema } from '$lib/server/validation';
import type { KeycloakCompatibility } from '$lib/shared/types';
import { getEnv } from '$lib/server/env';

export const POST: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) {
		throw error(401, 'Authentication required');
	}

	const { slug } = params;
	const db = getDatabase(platform);
	const env = getEnv(platform);

	// Get extension
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.slug, slug))
		.limit(1);

	if (!extension) {
		throw error(404, 'Extension not found');
	}

	// Check ownership
	if (extension.ownerId !== locals.user.id) {
		throw error(403, 'You do not own this extension');
	}

	// Get installation token for this repo
	const [owner, repoName] = extension.githubRepo.split('/');
	const installationId = await getRepoInstallation(
		env.GITHUB_APP_ID,
		env.GITHUB_PRIVATE_KEY,
		owner,
		repoName
	);

	if (!installationId) {
		throw error(403, 'GitHub App is not installed on this repository');
	}

	const installationToken = await getInstallationAccessToken(
		env.GITHUB_APP_ID,
		env.GITHUB_PRIVATE_KEY,
		installationId
	);

	// Get current repo details by ID to handle renames/transfers
	// First try to find the repo - it may have been renamed
	let currentRepoPath = extension.githubRepo;

	// GitHub API allows fetching repo by ID using special syntax
	// But the standard way is to try the current path first, then update if needed
	const repoDetails = await getRepoDetails(installationToken, currentRepoPath);

	if (!repoDetails) {
		// Repo not found - might have been deleted or made private
		await db.update(extensions)
			.set({
				lastSyncError: 'Repository not found. It may have been deleted, renamed, or made private.',
				lastSyncedAt: new Date()
			})
			.where(eq(extensions.id, extension.id));

		throw error(404, 'Repository not found. It may have been renamed or deleted.');
	}

	// Update repo path if it changed (repo was renamed/transferred)
	if (repoDetails.full_name !== extension.githubRepo) {
		await db.update(extensions)
			.set({ githubRepo: repoDetails.full_name })
			.where(eq(extensions.id, extension.id));

		currentRepoPath = repoDetails.full_name;
		console.log(`Repository renamed: ${extension.githubRepo} -> ${currentRepoPath}`);
	}

	// Fetch manifest from repo
	const manifestContent = await fetchRepoFile(
		installationToken,
		currentRepoPath,
		'keycloak-extension.yaml'
	);

	if (!manifestContent) {
		throw error(404, 'keycloak-extension.yaml not found in repository');
	}

	// Parse manifest
	let manifest;
	try {
		const parsedYaml = parseYaml(manifestContent);
		manifest = extensionManifestSchema.parse(parsedYaml);
	} catch (e) {
		throw error(400, `Invalid manifest: ${e instanceof Error ? e.message : 'Parse error'}`);
	}

	// Get existing versions
	const existingVersions = await db
		.select({ version: versions.version })
		.from(versions)
		.where(eq(versions.extensionId, extension.id));

	const existingVersionSet = new Set(existingVersions.map(v => v.version));

	// Fetch GitHub releases (using potentially updated repo path)
	const releases = await getRepoReleases(installationToken, currentRepoPath);

	// Filter to releases with JARs that we don't already have
	const newReleases = releases.filter(release => {
		const version = release.tag_name.replace(/^v/, '');
		if (existingVersionSet.has(version)) {
			return false;
		}

		const assetPattern = manifest.build?.assetName?.replace('{version}', version);
		return release.assets.some(
			(a) => a.name.endsWith('.jar') && (assetPattern ? a.name === assetPattern : true)
		);
	});

	// Process new releases
	const importedVersions: string[] = [];

	for (const release of newReleases) {
		const version = release.tag_name.replace(/^v/, '');

		// Get version-specific config
		const versionConfig = manifest.versions?.[version];
		const kcCompat: KeycloakCompatibility =
			versionConfig?.keycloakCompatibility ?? manifest.keycloakCompatibility;

		// Find JAR asset
		const assetPattern = manifest.build?.assetName?.replace('{version}', version);
		const jarAsset = release.assets.find(
			(a) => a.name.endsWith('.jar') && (assetPattern ? a.name === assetPattern : true)
		);

		if (!jarAsset) continue;

		try {
			// Download JAR
			const jarBuffer = await downloadReleaseAsset(jarAsset.browser_download_url);

			// Calculate SHA256
			const hashBuffer = await crypto.subtle.digest('SHA-256', jarBuffer);
			const sha256 = Array.from(new Uint8Array(hashBuffer))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('');

			// Upload to R2 (use extension ID for stable path, not repo name)
			const jarKey = `extensions/${extension.id}/${version}/${jarAsset.name}`;
			await platform!.env.BUCKET.put(jarKey, jarBuffer, {
				httpMetadata: { contentType: 'application/java-archive' },
				customMetadata: {
					'extension-id': extension.id.toString(),
					'github-repo': currentRepoPath,
					version,
					sha256
				}
			});

			const jarUrl = `${platform!.env.REGISTRY_URL ?? ''}/api/extensions/${extension.slug}/${version}/download`;

			// Insert version record
			await db.insert(versions).values({
				extensionId: extension.id,
				version,
				keycloakCompatibility: kcCompat,
				jarUrl,
				jarSize: jarAsset.size,
				sha256,
				githubReleaseTag: release.tag_name,
				githubReleaseUrl: release.html_url,
				releaseNotes: versionConfig?.releaseNotes ?? release.body,
				deprecated: versionConfig?.deprecated ?? false,
				deprecationMessage: versionConfig?.deprecationMessage,
				publishedAt: new Date(release.published_at)
			});

			importedVersions.push(version);
		} catch (e) {
			console.error(`Failed to process release ${release.tag_name}:`, e);
		}
	}

	// Update extension status if we now have versions
	if (importedVersions.length > 0 && extension.status === 'pending') {
		await db.update(extensions)
			.set({
				status: 'active',
				lastSyncedAt: new Date()
			})
			.where(eq(extensions.id, extension.id));
	} else {
		await db.update(extensions)
			.set({ lastSyncedAt: new Date() })
			.where(eq(extensions.id, extension.id));
	}

	return json({
		success: true,
		imported: importedVersions,
		message: importedVersions.length > 0
			? `Imported ${importedVersions.length} new version(s): ${importedVersions.join(', ')}`
			: 'No new versions found'
	});
};

