/**
 * Session management using JWT
 */

import type { Cookies } from '@sveltejs/kit';
import * as jose from 'jose';
import { getEnv } from '$lib/server/env';
import { SESSION_TTL_SECONDS, type SessionData } from '$lib/server/security/session';

const SESSION_COOKIE_NAME = 'session';

export async function getSessionIdFromCookie(
	cookies: Cookies,
	platform: App.Platform
): Promise<string | null> {
	const env = getEnv(platform);
	const token = cookies.get(SESSION_COOKIE_NAME);
	if (!token) {
		return null;
	}
	const secret = env.JWT_SECRET;
	const { payload } = await jose.jwtVerify(token, new TextEncoder().encode(secret));
	return payload.sid as string;
}

export async function setSessionCookie(
	sessionData: SessionData,
	cookies: Cookies,
	platform: App.Platform
): Promise<void> {
	const sessionCookie = await createSessionToken(sessionData, platform);
	cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: SESSION_TTL_SECONDS
	});
}

export function clearSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}

async function createSessionToken(
	sessionData: SessionData,
	platform: App.Platform
): Promise<string> {
	const env = getEnv(platform);
	return await new jose.SignJWT({ sid: sessionData.id })
		.setProtectedHeader({ alg: 'HS256' })
		.setExpirationTime(sessionData.expiresAt)
		.setIssuedAt(sessionData.createdAt)
		.sign(new TextEncoder().encode(env.JWT_SECRET));
}
