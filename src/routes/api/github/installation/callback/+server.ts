/**
 * GitHub App Installation Callback
 *
 * GitHub redirects here after the user installs/configures the app.
 * URL: /api/github/installation/callback?installation_id=XXX&setup_action=install
 */

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const installationId = url.searchParams.get('installation_id');
	const setupAction = url.searchParams.get('setup_action'); // 'install', 'update', or 'request'

	console.log('GitHub App installation callback:', { installationId, setupAction });

	// Redirect back to publish page
	// The publish page will now see the new installation
	redirect(302, '/publish?installed=true');
};

