/**
 * API endpoint to validate a repository for extension registration
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRepoInstallation, getInstallationAccessToken, fetchRepoFile } from '$lib/server/github';
import { extensionManifestSchema } from '$lib/server/validation';
import { getEnv } from '$lib/server/env';
import { parse as parseYaml } from 'yaml';

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json() as { repo?: string };
	const repo = body.repo;

	if (!repo || typeof repo !== 'string') {
		return json({ error: 'Repository name is required' }, { status: 400 });
	}

	const env = getEnv(platform);
	const [owner, repoName] = repo.split('/');

	try {
		// Get installation for this repo
		const installationId = await getRepoInstallation(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			owner,
			repoName
		);

		if (!installationId) {
			return json({
				validated: false,
				error: 'GitHub App not installed on this repository'
			});
		}

		// Get installation token
		const installationToken = await getInstallationAccessToken(
			env.GITHUB_APP_ID,
			env.GITHUB_PRIVATE_KEY,
			installationId
		);

		// Try to fetch manifest
		const manifestContent = await fetchRepoFile(installationToken, repo, 'keycloak-extension.yaml');

		if (!manifestContent) {
			return json({
				validated: false,
				error: 'Manifest file (keycloak-extension.yaml) not found in repository root'
			});
		}

		// Parse and validate manifest
		let manifest;
		try {
			manifest = parseYaml(manifestContent);
		} catch {
			return json({
				validated: false,
				error: 'Invalid YAML in manifest file'
			});
		}

		const parsed = extensionManifestSchema.safeParse(manifest);
		if (!parsed.success) {
			const errors = parsed.error.issues.map(i => i.message).join(', ');
			return json({
				validated: false,
				error: `Invalid manifest: ${errors}`
			});
		}

		return json({
			validated: true,
			manifest: {
				name: parsed.data.name,
				description: parsed.data.description
			}
		});
	} catch (e) {
		console.error('Validation error:', e);
		return json({
			validated: false,
			error: e instanceof Error ? e.message : 'Validation failed'
		});
	}
};

