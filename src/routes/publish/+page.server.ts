import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getDatabase, extensions, versions } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import {
	fetchRepoFile,
	getRepoReleases,
	getRepoDetails,
	downloadReleaseAsset,
	getRepoInstallation,
	getInstallationAccessToken,
	getAppInstallURL,
	type GitHubRelease
} from '$lib/server/github';
import { extensionManifestSchema, registerExtensionSchema } from '$lib/server/validation';
import { parse as parseYaml } from 'yaml';
import type { KeycloakCompatibility } from '$lib/shared/types';
import { getEnv } from '$lib/server/env';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	if (!locals.user) {
		redirect(302, '/api/auth/login');
	}

	const env = getEnv(platform);

	// Check if user just completed installation
	const justInstalled = url.searchParams.get('installed') === 'true';

	// Build the installation URL with redirect back to this page
	const origin = url.origin;
	const callbackUrl = `${origin}/api/github/installation/callback`;
	const installUrl = getAppInstallURL(env.GITHUB_APP_SLUG, callbackUrl);

	// Return immediately - repos will be loaded client-side via API
	return {
		justInstalled,
		installUrl,
		userId: locals.user.githubId
	};
};

export const actions: Actions = {
	// Register action - uses form submission for the actual registration
	register: async ({ request, locals, platform }) => {
		if (!locals.user) {
			return fail(401, { error: 'Authentication required' });
		}

		const formData = await request.formData();
		const githubRepo = formData.get('githubRepo')?.toString();

		// Validate input
		const parsed = registerExtensionSchema.safeParse({ githubRepo });
		if (!parsed.success) {
			return fail(400, { error: 'Invalid repository format' });
		}

		const db = getDatabase(platform);
		const env = getEnv(platform);

		// Get installation for this repo using GitHub App authentication
		const [owner, repo] = parsed.data.githubRepo.split('/');
		const installationId = await getRepoInstallation(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			owner,
			repo
		);

		if (!installationId) {
			return fail(403, {
				error: 'GitHub App is not installed on this repository. Please install the app first.'
			});
		}

		// Get installation access token
		const installationToken = await getInstallationAccessToken(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			installationId
		);

		// Fetch manifest from repo using installation token
		const manifestContent = await fetchRepoFile(
			installationToken,
			parsed.data.githubRepo,
			'keycloak-extension.yaml'
		);

		if (!manifestContent) {
			return fail(404, { error: 'keycloak-extension.yaml not found in repository' });
		}

		// Parse and validate manifest
		let manifest;
		try {
			const parsedYaml = parseYaml(manifestContent);
			manifest = extensionManifestSchema.parse(parsedYaml);
		} catch (e) {
			return fail(400, {
				error: `Invalid manifest: ${e instanceof Error ? e.message : 'Parse error'}`
			});
		}

		// Create slug from name
		const slug = manifest.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

		// Check slug uniqueness
		const [slugExists] = await db
			.select()
			.from(extensions)
			.where(eq(extensions.slug, slug))
			.limit(1);

		if (slugExists) {
			return fail(409, { error: `Extension with slug "${slug}" already exists` });
		}

		// Get repo details including stable ID
		const repoDetails = await getRepoDetails(installationToken, parsed.data.githubRepo);
		if (!repoDetails) {
			return fail(404, { error: 'Repository not found' });
		}

		// Check if repo is already registered by ID (handles renamed repos)
		const [existingById] = await db
			.select()
			.from(extensions)
			.where(eq(extensions.githubRepoId, repoDetails.id))
			.limit(1);

		if (existingById) {
			return fail(409, {
				error: `This repository is already registered as "${existingById.slug}". Repositories can only be registered once.`
			});
		}

		// Fetch GitHub releases
		const releases = await getRepoReleases(installationToken, parsed.data.githubRepo);

		// Filter to releases that have JAR assets
		const releasesWithJars = releases.filter(release => {
			const assetPattern = manifest.build?.assetName?.replace('{version}', release.tag_name.replace(/^v/, ''));
			return release.assets.some(
				(a) => a.name.endsWith('.jar') && (assetPattern ? a.name === assetPattern : true)
			);
		});

		// Determine initial status based on whether there are releases
		const hasReleases = releasesWithJars.length > 0;
		const initialStatus = hasReleases ? 'active' : 'pending';

		// Create extension record
		const [extension] = await db
			.insert(extensions)
			.values({
				slug,
				name: manifest.name,
				description: manifest.description,
				githubRepoId: repoDetails.id, // Stable GitHub repo ID
				githubRepo: repoDetails.full_name, // Current path (may change if renamed)
				ownerId: locals.user.id,
				homepage: manifest.homepage,
				license: manifest.license ?? repoDetails.license?.name,
				category: manifest.categories?.[0] ?? 'Other',
				status: initialStatus,
				lastSyncedAt: new Date()
			})
			.returning();

		// Process releases if any
		const processedVersions: string[] = [];

		for (const release of releasesWithJars) {
			const version = await processRelease(
				release,
				manifest,
				extension.id,
				parsed.data.githubRepo,
				platform!
			);
			if (version) {
				processedVersions.push(version);
			}
		}

		return {
			success: true,
			slug: extension.slug,
			versions: processedVersions,
			status: initialStatus,
			message: hasReleases
				? `Extension registered with ${processedVersions.length} version(s)!`
				: 'Extension registered! Create a GitHub release with a JAR file to publish your first version.'
		};
	}
};

async function processRelease(
	release: GitHubRelease,
	manifest: any,
	extensionId: number,
	githubRepo: string,
	platform: App.Platform
): Promise<string | null> {
	const db = getDatabase(platform);

	// Parse version from tag
	const version = release.tag_name.replace(/^v/, '');

	// Get version-specific config
	const versionConfig = manifest.versions?.[version];
	const kcCompat: KeycloakCompatibility =
		versionConfig?.keycloakCompatibility ?? manifest.keycloakCompatibility;

	// Find JAR asset
	const assetPattern = manifest.build.assetName?.replace('{version}', version);
	const jarAsset = release.assets.find(
		(a) => a.name.endsWith('.jar') && (assetPattern ? a.name === assetPattern : true)
	);

	if (!jarAsset) {
		return null;
	}

	// Download JAR
	const jarBuffer = await downloadReleaseAsset(jarAsset.browser_download_url);

	// Calculate SHA256
	const hashBuffer = await crypto.subtle.digest('SHA-256', jarBuffer);
	const sha256 = Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Upload to R2
	const jarKey = `extensions/${githubRepo}/${version}/${jarAsset.name}`;
	await platform.env.BUCKET.put(jarKey, jarBuffer, {
		httpMetadata: { contentType: 'application/java-archive' },
		customMetadata: { 'github-repo': githubRepo, version, sha256 }
	});

	const jarUrl = `${platform.env.REGISTRY_URL ?? ''}/api/extensions/${manifest.name}/${version}/download`;

	// Insert version record
	await db.insert(versions).values({
		extensionId,
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

	return version;
}
