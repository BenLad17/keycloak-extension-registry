/**
 * API: POST /api/webhooks/github
 * GitHub webhook handler for auto-sync
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	verifyWebhookSignature,
	fetchRepoFile,
	getRepoReleases,
	getRepoInstallation,
	getInstallationAccessToken
} from '$lib/server/github';
import { getDatabase, extensions, versions } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { parse as parseYaml } from 'yaml';
import { extensionManifestSchema, type VersionConfigInput } from '$lib/server/validation';
import { getEnv } from '$lib/server/env';

export const POST: RequestHandler = async ({ request, platform }) => {
	const payload = await request.text();
	const signature = request.headers.get('X-Hub-Signature-256');
	const event = request.headers.get('X-GitHub-Event');

	const env = getEnv(platform);
	if (!env.GITHUB_WEBHOOK_SECRET) {
		throw error(500, 'Webhook not configured');
	}

	// Verify signature
	const isValid = await verifyWebhookSignature(payload, signature, env.GITHUB_WEBHOOK_SECRET);
	if (!isValid) {
		throw error(401, 'Invalid signature');
	}

	const data = JSON.parse(payload);

	switch (event) {
		case 'push':
			return handlePush(data, platform!, env);

		case 'release':
			if (data.action === 'published') {
				return handleRelease(data, platform!, env);
			}
			break;

		case 'ping':
			return json({ message: 'Pong!' });
	}

	return json({ message: 'Event ignored' });
};

async function handlePush(data: any, platform: App.Platform, env: ReturnType<typeof getEnv>) {
	const repo = data.repository.full_name;
	const commits = data.commits || [];

	// Check if manifest was modified
	const manifestChanged = commits.some(
		(c: any) =>
			c.added?.includes('keycloak-extension.yaml') ||
			c.modified?.includes('keycloak-extension.yaml')
	);

	if (!manifestChanged) {
		return json({ message: 'No manifest changes' });
	}

	const db = getDatabase(platform);

	// Find extension
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.githubRepo, repo))
		.limit(1);

	if (!extension) {
		return json({ message: 'Extension not registered' });
	}

	// Get installation token for this repo (using GitHub App, not user token)
	const [owner, repoName] = repo.split('/');
	const installationId = await getRepoInstallation(
		env.GITHUB_APP_ID,
		env.GITHUB_PRIVATE_KEY,
		owner,
		repoName
	);

	if (!installationId) {
		return json({ message: 'GitHub App not installed on repository' });
	}

	const installationToken = await getInstallationAccessToken(
		env.GITHUB_APP_ID,
		env.GITHUB_PRIVATE_KEY,
		installationId
	);

	// Fetch updated manifest
	const manifestContent = await fetchRepoFile(installationToken, repo, 'keycloak-extension.yaml');

	if (!manifestContent) {
		await db
			.update(extensions)
			.set({
				lastSyncError: 'Manifest not found',
				lastSyncedAt: new Date()
			})
			.where(eq(extensions.id, extension.id));

		return json({ message: 'Manifest not found' });
	}

	// Parse and validate
	try {
		const parsed = parseYaml(manifestContent);
		const manifest = extensionManifestSchema.parse(parsed);

		// Update extension metadata
		await db
			.update(extensions)
			.set({
				name: manifest.name,
				description: manifest.description,
				homepage: manifest.homepage,
				license: manifest.license,
				category: manifest.categories?.[0] ?? extension.category,
				lastSyncedAt: new Date(),
				lastSyncError: null,
				updatedAt: new Date()
			})
			.where(eq(extensions.id, extension.id));

		// Update version compatibility from manifest
		if (manifest.versions) {
			for (const [ver, config] of Object.entries(manifest.versions) as [string, VersionConfigInput][]) {
				if (config.keycloakCompatibility) {
					await db
						.update(versions)
						.set({
							keycloakCompatibility: config.keycloakCompatibility,
							deprecated: config.deprecated ?? false,
							deprecationMessage: config.deprecationMessage
						})
						.where(eq(versions.version, ver));
				}
			}
		}

		return json({ message: 'Synced successfully' });
	} catch (e) {
		await db
			.update(extensions)
			.set({
				lastSyncError: e instanceof Error ? e.message : 'Parse error',
				lastSyncedAt: new Date()
			})
			.where(eq(extensions.id, extension.id));

		return json({ message: 'Manifest validation failed' });
	}
}

async function handleRelease(data: any, platform: App.Platform, env: ReturnType<typeof getEnv>) {
	const repo = data.repository.full_name;
	const release = data.release;

	const db = getDatabase(platform);

	// Find extension
	const [extension] = await db
		.select()
		.from(extensions)
		.where(eq(extensions.githubRepo, repo))
		.limit(1);

	if (!extension) {
		return json({ message: 'Extension not registered' });
	}

	// TODO: Process new release using installation token
	// Get installation token:
	// const [owner, repoName] = repo.split('/');
	// const installationId = await getRepoInstallation(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, owner, repoName);
	// const installationToken = await getInstallationAccessToken(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, installationId);

	return json({
		message: 'Release received',
		tag: release.tag_name,
		action: 'pending_implementation'
	});
}
