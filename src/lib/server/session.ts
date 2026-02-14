/**
 * Session management using JWT
 */

import type { Cookies } from '@sveltejs/kit';

export interface SessionData {
	userId: number;
	githubId: number;
	username: string;
	avatarUrl: string | null;
}

const SESSION_COOKIE_NAME = 'session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/**
 * Create a JWT session token
 */
export async function createSessionToken(data: SessionData, secret: string): Promise<string> {
	const header = { alg: 'HS256', typ: 'JWT' };
	const payload = {
		...data,
		iat: Math.floor(Date.now() / 1000),
		exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
	};

	const encoder = new TextEncoder();

	const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
	const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '');

	const signatureInput = `${headerB64}.${payloadB64}`;

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(signatureInput));

	const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer))).replace(
		/=/g,
		''
	);

	return `${headerB64}.${payloadB64}.${signatureB64}`;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(
	token: string,
	secret: string
): Promise<SessionData | null> {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const [headerB64, payloadB64, signatureB64] = parts;

		// Verify signature
		const encoder = new TextEncoder();
		const signatureInput = `${headerB64}.${payloadB64}`;

		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(secret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);

		// Decode signature
		const signature = Uint8Array.from(atob(signatureB64), (c) => c.charCodeAt(0));

		const isValid = await crypto.subtle.verify(
			'HMAC',
			key,
			signature,
			encoder.encode(signatureInput)
		);

		if (!isValid) return null;

		// Decode payload
		const payload = JSON.parse(atob(payloadB64));

		// Check expiration
		if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return {
			userId: payload.userId,
			githubId: payload.githubId,
			username: payload.username,
			avatarUrl: payload.avatarUrl
		};
	} catch {
		return null;
	}
}

/**
 * Set session cookie
 */
export function setSessionCookie(cookies: Cookies, token: string): void {
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_MAX_AGE
	});
}

/**
 * Get session from cookies
 */
export async function getSession(cookies: Cookies, secret: string): Promise<SessionData | null> {
	const token = cookies.get(SESSION_COOKIE_NAME);
	if (!token) return null;

	return verifySessionToken(token, secret);
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

