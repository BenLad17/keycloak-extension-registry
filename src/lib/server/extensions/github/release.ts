import {
	type Extension,
	extensionVersion,
	getDatabase,
	type NewExtensionVersion
} from '$lib/server/db';
import { Octokit } from 'octokit';
import { and, eq } from 'drizzle-orm';

export async function checkForNewReleases(
	extension: Extension,
	platform: App.Platform
): Promise<void> {
	try {
		const newReleases = await getNewReleases(extension, platform);
		if (newReleases.length > 0) {
			const db = getDatabase(platform);
			await db.insert(extensionVersion).values(newReleases);
		}
	} catch (error) {
		console.error(`Error checking for new releases for extension ${extension.id}:`, error);
	}
}

async function getNewReleases(
	extension: Extension,
	platform: App.Platform
): Promise<NewExtensionVersion[]> {
	const releases = await getReleases(extension);

	const result: NewExtensionVersion[] = [];
	for (const release of releases) {
		const exists = await releaseExists(extension.id, release.tag_name, platform);
		if (exists) {
			continue;
		}
		console.log(`Found new release ${release.tag_name} for extension ${extension.id}`);

		const asset = findReleaseJarAsset(release);
		const assetFileResponse = await fetch(asset.browser_download_url);

		if (!assetFileResponse.ok || !assetFileResponse.body) {
			console.error(
				`Failed to fetch asset for release ${release.tag_name} of extension ${extension.id}`
			);
			continue;
		}

		const file = await assetFileResponse.body.getReader().read();
		if (!file || !file.value) {
			console.error(
				`Failed to read asset file for release ${release.tag_name} of extension ${extension.id}`
			);
			continue;
		}

		const digest = await crypto.subtle.digest('SHA-256', file.value);
		const digestHex = Array.from(new Uint8Array(digest))
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');

		const insertRelease: NewExtensionVersion = {
			extensionId: extension.id,
			version: release.tag_name,
			downloadUrl: asset.browser_download_url,
			downloadCount: asset.download_count,
			downloadSize: file.value.byteLength,
			digest: digestHex,
			releaseNotes: release.body,
			publishedAt: release.published_at ? new Date(release.published_at) : new Date()
		};
		result.push(insertRelease);
	}
	return result;
}

async function getReleases(extension: Extension) {
	const octokit = new Octokit();
	const response = await octokit.request('GET /repos/{owner}/{repo}/releases', {
		owner: extension.githubRepoOwner,
		repo: extension.githubRepoName
	});
	return response.data;
}

function findReleaseJarAsset(release: any) {
	// TODO: we might want to support multiple assets in the future
	return release.assets.find((a: any) => a.name.endsWith('.jar'));
}

async function releaseExists(extensionId: number, version: string, platform: App.Platform) {
	const db = getDatabase(platform);
	const existing = await db
		.select()
		.from(extensionVersion)
		.where(
			and(eq(extensionVersion.extensionId, extensionId), eq(extensionVersion.version, version))
		)
		.limit(1);
	return existing.length === 1;
}
