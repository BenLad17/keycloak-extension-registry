import { type Cookies, error, redirect } from '@sveltejs/kit';
import { getUser } from '$lib/server/security/user';
import { getDatabase, type User, user } from '$lib/server/db';
import { Octokit } from 'octokit';
import { getEnv } from '$lib/server/env';
import { eq } from 'drizzle-orm';
import { createSession } from '$lib/server/security/session';

export function isAuthenticated(locals: App.Locals): boolean {
	return !!locals?.session;
}

export async function getAuthenticatedUser(
	locals: App.Locals,
	platform: App.Platform
): Promise<User | null> {
	return locals?.session ? await getUser(locals.session.userId, platform) : null;
}

export async function requireAuth(
	url: URL,
	cookies: Cookies,
	platform: App.Platform,
	locals: App.Locals
): Promise<User> {
	const session = locals.session;
	if (session) {
		return await getUser(session.userId, platform!);
	} else {
		await initializeAuth(url, cookies, platform!, url.pathname);
	}
	throw new Error('Authentication failed');
}

export async function initializeAuth(
	url: URL,
	cookies: Cookies,
	platform: App.Platform,
	redirectToPath: string
): Promise<void> {
	const state = crypto.randomUUID();
	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 600
	});

	cookies.set('oauth_redirect_to', redirectToPath, {
		path: '/',
		httpOnly: true,
		secure: url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 600
	});

	const env = getEnv(platform);
	if (!env.GITHUB_CLIENT_ID) {
		throw new Error('GITHUB_CLIENT_ID not configured');
	}

	const redirectUri = `${url.origin}/api/auth/callback`;
	const authUrl = getGitHubOAuthURL(env.GITHUB_CLIENT_ID, redirectUri, state);

	redirect(301, authUrl);
}

export async function processOAuthCallback(url: URL, cookies: Cookies, platform: App.Platform) {
	const env = getEnv(platform);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.JWT_SECRET) {
		error(500, 'OAuth not configured');
	}

	// Validate state parameter
	const storedState = cookies.get('oauth_state');
	cookies.delete('oauth_state', { path: '/' });
	if (!code || !state || state !== storedState) {
		error(400, 'Invalid OAuth state');
	}

	// Validate redirect path
	const redirectTo = cookies.get('oauth_redirect_to') || '/';
	cookies.delete('oauth_redirect_to', { path: '/' });
	if (!redirectTo.startsWith('/')) {
		error(400, 'Invalid redirect path');
	}

	// Exchange code for access token
	const accessToken = await exchangeCodeForToken(
		code,
		env.GITHUB_CLIENT_ID,
		env.GITHUB_CLIENT_SECRET
	);

	// Get GitHub user info
	const githubUser = await getGitHubUser(accessToken);

	// Upsert user in database
	const db = getDatabase(platform);
	let [localUser] = await db.select().from(user).where(eq(user.githubId, githubUser.id)).limit(1);

	if (!localUser) {
		[localUser] = await db.insert(user).values({ githubId: githubUser.id }).returning();
	}

	await createSession(localUser.id, platform!, cookies, accessToken);

	redirect(301, redirectTo);
}

export function getGitHubOAuthURL(clientId: string, redirectUri: string, state: string): string {
	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		state: state,
		scope: 'read:user user:email public_repo'
	});
	return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(
	code: string,
	clientId: string,
	clientSecret: string
): Promise<string> {
	const octokit = new Octokit();
	const { data } = await octokit.request('POST /login/oauth/access_token', {
		baseUrl: 'https://github.com',
		headers: { accept: 'application/json' },
		client_id: clientId,
		client_secret: clientSecret,
		code: code
	});

	if (data.error) {
		throw new Error(`OAuth error: ${data.error_description || data.error}`);
	}
	return data.access_token;
}

export async function getGitHubUser(accessToken: string) {
	const octokit = new Octokit({ auth: accessToken });
	const response = await octokit.rest.users.getAuthenticated();
	if (!response || !response.data) {
		error(500, 'Failed to fetch GitHub user');
	}
	return response.data;
}

export async function hasRepoWriteAccess(
	token: string,
	owner: string,
	repo: string
): Promise<boolean> {
	try {
		const octokit = new Octokit({ auth: token });
		const { data } = await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
		return data.permissions?.push === true;
	} catch {
		return false;
	}
}

export async function isRegistryAdmin(token: string, platform: App.Platform): Promise<boolean> {
	const registryRepo = getEnv(platform).REGISTRY_GITHUB_REPO;
	if (!registryRepo) return false;
	const [owner, repo] = registryRepo.split('/');
	if (!owner || !repo) return false;
	return hasRepoWriteAccess(token, owner, repo);
}
