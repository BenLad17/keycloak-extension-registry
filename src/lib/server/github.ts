/**
 * GitHub App Authentication & API
 *
 * GitHub Apps are preferred over OAuth Apps because:
 * - Granular permissions (only what we need)
 * - Installation-based access (per repo/org)
 * - Built-in webhooks
 * - Higher rate limits
 * - Better security (no user tokens stored long-term)
 */

// =============================================================================
// Types
// =============================================================================

export interface GitHubUser {
    id: number;
    login: string;
    email: string | null;
    avatar_url: string;
    name: string | null;
}

export interface GitHubRepo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    owner: {
        id: number;
        login: string;
        avatar_url?: string;
    };
    permissions?: {
        admin: boolean;
        push: boolean;
        pull: boolean;
    };
}

export interface GitHubRepoDetails extends GitHubRepo {
    default_branch: string;
    license?: {
        key: string;
        name: string;
    } | null;
}

export interface GitHubRelease {
    id: number;
    tag_name: string;
    name: string | null;
    body: string | null;
    draft: boolean;
    prerelease: boolean;
    published_at: string;
    html_url: string;
    assets: GitHubReleaseAsset[];
}

export interface GitHubReleaseAsset {
    id: number;
    name: string;
    size: number;
    browser_download_url: string;
    content_type: string;
}

export interface GitHubInstallation {
    id: number;
    account: {
        login: string;
        id: number;
        type: 'User' | 'Organization';
    };
    repository_selection: 'all' | 'selected';
    permissions: Record<string, string>;
}

export interface GitHubAppConfig {
    appId: string;
    clientId: string;
    clientSecret: string;
    privateKey: string;
    webhookSecret?: string;
}

// =============================================================================
// GitHub App JWT Generation
// =============================================================================

// Cache for App JWT (in-memory, survives for worker lifetime)
let cachedJWT: { token: string; expiresAt: number } | null = null;

/**
 * Generate a JWT for GitHub App authentication
 * Used to get installation access tokens
 *
 * Uses Web Crypto API (works in Cloudflare Workers)
 */
export async function generateAppJWT(appId: string, privateKey: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Return cached JWT if still valid (with 60s buffer)
    if (cachedJWT && cachedJWT.expiresAt > now + 60) {
        return cachedJWT.token;
    }

    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
        iat: now - 60, // Issued 60 seconds ago (clock skew)
        exp: now + 300, // Expires in 5 minutes
        iss: appId
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Clean up the private key (handle multiline strings from env)
    const cleanedKey = privateKey
        .replace(/\\n/g, '\n')  // Handle escaped newlines
        .split('\n')
        .map(line => line.trim())
        .join('\n');

    const signature = await signWithWebCrypto(signatureInput, cleanedKey);
    const token = `${headerB64}.${payloadB64}.${signature}`;

    cachedJWT = {
        token,
        expiresAt: payload.exp
    };

    return token;
}

/**
 * Sign using Web Crypto API (for Cloudflare Workers)
 * Converts PKCS#1 to PKCS#8 format if needed
 */
async function signWithWebCrypto(data: string, pemKey: string): Promise<string> {
    const encoder = new TextEncoder();

    // Extract the base64 key content
    let keyContent = pemKey
        .replace(/-----BEGIN (RSA )?PRIVATE KEY-----/, '')
        .replace(/-----END (RSA )?PRIVATE KEY-----/, '')
        .replace(/\s/g, '');

    // Check if it's PKCS#1 (RSA PRIVATE KEY) and convert to PKCS#8
    const isPKCS1 = pemKey.includes('BEGIN RSA PRIVATE KEY');

    let keyData: ArrayBuffer;
    if (isPKCS1) {
        // PKCS#1 to PKCS#8 conversion
        // Add PKCS#8 wrapper around PKCS#1 key
        const pkcs1Key = Uint8Array.from(atob(keyContent), c => c.charCodeAt(0));
        keyData = wrapPKCS1toPKCS8(pkcs1Key);
    } else {
        keyData = Uint8Array.from(atob(keyContent), c => c.charCodeAt(0)).buffer;
    }

    const key = await crypto.subtle.importKey(
        'pkcs8',
        keyData,
        {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'},
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        key,
        encoder.encode(data)
    );

    // Convert to base64url
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

/**
 * Wrap a PKCS#1 RSA private key in PKCS#8 format
 */
function wrapPKCS1toPKCS8(pkcs1Key: Uint8Array): ArrayBuffer {
    // PKCS#8 header for RSA keys (OID 1.2.840.113549.1.1.1)
    const pkcs8Header = new Uint8Array([
        0x30, 0x82, 0x00, 0x00, // SEQUENCE (length placeholder)
        0x02, 0x01, 0x00,       // INTEGER 0 (version)
        0x30, 0x0d,             // SEQUENCE
        0x06, 0x09,             // OID
        0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // 1.2.840.113549.1.1.1 (rsaEncryption)
        0x05, 0x00,             // NULL
        0x04, 0x82, 0x00, 0x00  // OCTET STRING (length placeholder)
    ]);

    // Calculate lengths
    const totalLength = pkcs8Header.length - 4 + pkcs1Key.length;
    const octetStringLength = pkcs1Key.length;

    // Create the PKCS#8 key
    const pkcs8Key = new Uint8Array(4 + totalLength);
    pkcs8Key.set(pkcs8Header);
    pkcs8Key.set(pkcs1Key, pkcs8Header.length);

    // Update length fields
    // Total SEQUENCE length (bytes 2-3)
    pkcs8Key[2] = ((totalLength >> 8) & 0xff);
    pkcs8Key[3] = (totalLength & 0xff);

    // OCTET STRING length (bytes at position 24-25, which is header length - 2)
    const octetLengthPos = pkcs8Header.length - 2;
    pkcs8Key[octetLengthPos] = ((octetStringLength >> 8) & 0xff);
    pkcs8Key[octetLengthPos + 1] = (octetStringLength & 0xff);

    return pkcs8Key.buffer;
}

/**
 * Base64URL encode a string
 */
function base64UrlEncode(str: string): string {
    return btoa(str)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

// Cache for installation tokens (in-memory, survives for worker lifetime)
const installationTokenCache = new Map<number, { token: string; expiresAt: number }>();

/**
 * Get an installation access token for a specific installation
 * Tokens are cached for 50 minutes (they expire after 1 hour)
 */
export async function getInstallationAccessToken(
    appId: string,
    privateKey: string,
    installationId: number
): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    // Check cache first (with 10 minute buffer before expiry)
    const cached = installationTokenCache.get(installationId);
    if (cached && cached.expiresAt > now + 600) {
        return cached.token;
    }

    const jwt = await generateAppJWT(appId, privateKey);

    const res = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Keycloak-Extension-Registry'
            }
        }
    );

    if (!res.ok) {
        const errorBody = await res.text();
        console.error('Installation token error:', {
            status: res.status,
            body: errorBody,
            installationId
        });
        throw new Error(`Failed to get installation token: ${res.status} - ${errorBody}`);
    }

    const data = await res.json() as { token: string; expires_at: string };

    // Cache the token
    installationTokenCache.set(installationId, {
        token: data.token,
        expiresAt: Math.floor(new Date(data.expires_at).getTime() / 1000)
    });

    return data.token;
}

/**
 * Get all app installations and their repos for a specific GitHub user
 * Uses App authentication (not user token) to find installations where the user has access
 *
 * Always fetches live data - no caching (user expects to see new repos immediately)
 */
export async function getUserInstallationsWithRepos(
    appId: string,
    privateKey: string,
    githubUserId: number
): Promise<Array<{ installationId: number; token: string; repos: GitHubRepo[] }>> {
    const jwt = await generateAppJWT(appId, privateKey);

    // Get all installations of our app
    const installationsRes = await fetch('https://api.github.com/app/installations', {
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Keycloak-Extension-Registry'
        }
    });

    if (!installationsRes.ok) {
        console.error('Failed to get app installations:', installationsRes.status);
        return [];
    }

    const installations: GitHubInstallation[] = await installationsRes.json();
    const result: Array<{ installationId: number; token: string; repos: GitHubRepo[] }> = [];

    for (const installation of installations) {
        // Get installation access token
        const token = await getInstallationAccessToken(appId, privateKey, installation.id);

        // Get repos accessible to this installation
        const reposRes = await fetch(
            `https://api.github.com/installation/repositories?per_page=100`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Keycloak-Extension-Registry'
                }
            }
        );

        if (!reposRes.ok) {
            console.error('Failed to get installation repos:', reposRes.status);
            continue;
        }

        const reposData = await reposRes.json() as { repositories?: GitHubRepo[] };
        const repos: GitHubRepo[] = reposData.repositories ?? [];

        // Filter repos where the user has access (owner or collaborator)
        // For user installations, this is straightforward
        // For org installations, we include repos the user can access
        const userRepos = repos.filter(repo =>
            repo.owner.id === githubUserId || // User's own repos
            installation.account.id === githubUserId // User's personal installation
        );

        // If this is a user installation for our user, or an org with accessible repos
        if (installation.account.id === githubUserId || userRepos.length > 0) {
            result.push({
                installationId: installation.id,
                token,
                repos: installation.account.id === githubUserId ? repos : userRepos
            });
        }
    }


    return result;
}

// =============================================================================
// OAuth Web Flow (for user authentication ONLY - identity, not repo access)
// =============================================================================

/**
 * Get GitHub OAuth URL for user login
 * Note: GitHub Apps also support OAuth for user identification
 */
export function getGitHubOAuthURL(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        state: state,
        // Request minimal scopes - we only need user identity
        // Repo access comes from App installation, not OAuth
        scope: 'read:user user:email'
    });

    return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Exchange OAuth code for user access token
 */
export async function exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string
): Promise<string> {
    const res = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code: code
        })
    });

    if (!res.ok) {
        throw new Error(`OAuth token exchange failed: ${res.status}`);
    }

    const data = await res.json() as { error?: string; error_description?: string; access_token?: string };

    if (data.error) {
        throw new Error(`OAuth error: ${data.error_description || data.error}`);
    }

    return data.access_token!;
}

/**
 * Get authenticated user info (requires access token)
 * Used only during OAuth login to get initial user identity
 */
export async function getGitHubUser(accessToken: string): Promise<GitHubUser> {
    const res = await fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Keycloak-Extension-Registry'
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to get user: ${res.status}`);
    }

    return res.json();
}

/**
 * Get public user info by GitHub ID (no authentication required)
 */
export async function getGitHubUserById(githubId: number): Promise<GitHubUser | null> {
    const res = await fetch(`https://api.github.com/user/${githubId}`, {
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Keycloak-Extension-Registry'
        }
    });

    if (res.status === 404) {
        return null; // User deleted their GitHub account
    }

    if (!res.ok) {
        throw new Error(`Failed to get user by ID: ${res.status}`);
    }

    return res.json();
}

// =============================================================================
// GitHub User Profile with Caching
// =============================================================================

import { CacheKeys, CacheTTL, type CacheStore } from './cache';

/**
 * Get GitHub user profile with caching
 * Uses Cloudflare KV in production, in-memory for local dev
 *
 * @param githubId - The user's GitHub ID
 * @param cache - Cache store (from platform)
 * @returns User profile or null if not found
 */
export async function getCachedGitHubUser(
    githubId: number,
    cache: CacheStore
): Promise<GitHubUser | null> {
    const cacheKey = CacheKeys.githubUser(githubId);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        try {
            return JSON.parse(cached) as GitHubUser;
        } catch {
            // Invalid cache entry, fetch fresh
        }
    }

    // Fetch from GitHub
    try {
        const user = await getGitHubUserById(githubId);

        if (user) {
            // Cache the result
            await cache.set(cacheKey, JSON.stringify(user), CacheTTL.GITHUB_USER);
        }

        return user;
    } catch (err) {
        // On error, return stale cache if available
        if (cached) {
            console.warn(`Failed to fetch GitHub user ${githubId}, using stale cache:`, err);
            try {
                return JSON.parse(cached) as GitHubUser;
            } catch {
                // Can't use cache
            }
        }
        throw err;
    }
}

// =============================================================================
// Repository Operations (using Installation Token)
// =============================================================================

/**
 * Get installation ID for a specific repository
 */
export async function getRepoInstallation(
    appId: string,
    privateKey: string,
    owner: string,
    repo: string
): Promise<number | null> {
    const jwt = await generateAppJWT(appId, privateKey);

    const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/installation`,
        {
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Keycloak-Extension-Registry'
            }
        }
    );

    if (res.status === 404) {
        return null; // App not installed on this repo
    }

    if (!res.ok) {
        throw new Error(`Failed to get repo installation: ${res.status}`);
    }

    const data = await res.json() as { id: number };
    return data.id;
}

/**
 * Get detailed repository information including stable ID
 * The repo ID is stable even if the repo is renamed or transferred
 */
export async function getRepoDetails(
    installationToken: string,
    githubRepo: string
): Promise<GitHubRepoDetails | null> {
    const res = await fetch(
        `https://api.github.com/repos/${githubRepo}`,
        {
            headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Keycloak-Extension-Registry'
            }
        }
    );

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error(`Failed to get repo details: ${res.status}`);
    }

    return res.json();
}

/**
 * Fetch a file from a repository
 */
export async function fetchRepoFile(
    installationToken: string,
    githubRepo: string,
    filePath: string,
    ref: string = 'HEAD'
): Promise<string | null> {
    const res = await fetch(
        `https://api.github.com/repos/${githubRepo}/contents/${filePath}?ref=${ref}`,
        {
            headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3.raw',
                'User-Agent': 'Keycloak-Extension-Registry'
            }
        }
    );

    if (res.status === 404) {
        return null;
    }

    if (!res.ok) {
        throw new Error(`Failed to fetch file: ${res.status}`);
    }

    return res.text();
}

/**
 * Get all releases for a repository
 */
export async function getRepoReleases(
    installationToken: string,
    githubRepo: string
): Promise<GitHubRelease[]> {
    const res = await fetch(
        `https://api.github.com/repos/${githubRepo}/releases`,
        {
            headers: {
                'Authorization': `Bearer ${installationToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Keycloak-Extension-Registry'
            }
        }
    );

    if (!res.ok) {
        throw new Error(`Failed to get releases: ${res.status}`);
    }

    const releases: GitHubRelease[] = await res.json();

    // Filter out drafts
    return releases.filter(r => !r.draft);
}

/**
 * Download a release asset
 */
export async function downloadReleaseAsset(downloadUrl: string): Promise<ArrayBuffer> {
    const res = await fetch(downloadUrl, {
        headers: {
            'User-Agent': 'Keycloak-Extension-Registry'
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to download asset: ${res.status}`);
    }

    return res.arrayBuffer();
}

// =============================================================================
// Webhook Verification
// =============================================================================

/**
 * Verify GitHub webhook signature
 */
export async function verifyWebhookSignature(
    payload: string,
    signature: string | null,
    secret: string
): Promise<boolean> {
    if (!signature || !signature.startsWith('sha256=')) {
        return false;
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        {name: 'HMAC', hash: 'SHA-256'},
        false,
        ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    );

    const expectedSignature = 'sha256=' + Array.from(new Uint8Array(signatureBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

    return signature === expectedSignature;
}

// =============================================================================
// Helper: Get App Installation URL
// =============================================================================

/**
 * Get URL to install/configure the GitHub App
 * After installation, GitHub redirects back to our callback URL
 *
 * @param appSlug - The app's slug (URL-friendly name)
 * @param redirectUrl - URL to redirect to after installation (optional)
 */
export function getAppInstallURL(appSlug: string, redirectUrl?: string): string {
    // Use the installation flow that redirects back after completion
    let url = `https://github.com/apps/${appSlug}/installations/new`;

    if (redirectUrl) {
        // GitHub will redirect to this URL after installation with installation_id parameter
        url += `?state=${encodeURIComponent(redirectUrl)}`;
    }

    return url;
}
