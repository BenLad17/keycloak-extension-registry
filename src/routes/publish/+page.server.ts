import type { Actions } from '@sveltejs/kit';
import { extension, getDatabase } from '$lib/server/db';
import { checkForNewReleases } from '$lib/server/extensions/github/release';
import { updateDownloadCounts } from '$lib/server/extensions/github/downloads';

export const actions: Actions = {
	default: async ({ request, platform }) => {
		const formData = await request.formData();
		const repository = formData.get('repository') as string;

		const db = getDatabase(platform);
		const extensions = await db.select().from(extension);

		for (const ext of extensions) {
			await checkForNewReleases(ext, platform!);
			await updateDownloadCounts(ext.id, platform!);
		}
	}
};
