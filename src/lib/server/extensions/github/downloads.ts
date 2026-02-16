import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { Octokit } from 'octokit';

export async function updateDownloadCounts(extensionId: number, platform: App.Platform) {
	const db = getDatabase(platform);
	const octokit = new Octokit();
	const [extensionToUpdate] = await db
		.select()
		.from(extension)
		.where(eq(extension.id, extensionId))
		.limit(1);
	const versions = await db
		.select()
		.from(extensionVersion)
		.where(eq(extensionVersion.extensionId, extensionId));

	let totalDownloads =  0;
	for (const version of versions) {
		const githubRelease = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
			owner: extensionToUpdate.githubRepoOwner,
			repo: extensionToUpdate.githubRepoName,
			tag: version.version
		});
		const githubReleaseAsset = githubRelease.data.assets.find(
			(asset) => asset.browser_download_url === version.downloadUrl
		);
		if (githubReleaseAsset) {
			const downloadCount = githubReleaseAsset.download_count;
			console.log(
				`Updating download count for version ${version.version} of extension ${extensionId} to ${downloadCount}`
			);
			await db
				.update(extensionVersion)
				.set({ downloadCount: downloadCount })
				.where(eq(extensionVersion.id, version.id));
			totalDownloads += downloadCount;
		}
	}
	console.log(`Updating total download count for extension ${extensionId} to ${totalDownloads}`);
	await db.update(extension).set({ downloadCount: totalDownloads }).where(eq(extension.id, extensionId));
}
