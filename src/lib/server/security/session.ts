import { deleteSessionData, setSessionData } from '$lib/server/security/session-store';
import { clearSessionCookie, setSessionCookie } from '$lib/server/security/session-cookie';
import type { Cookies } from '@sveltejs/kit';
import { getEnv } from '$lib/server/env';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SLIDING_THRESHOLD_SECONDS = 60 * 60 * 24; // 1 day

export interface SessionData {
	id: string;
	userId: number;
	createdAt: number;
	expiresAt: number;
}

export async function createSession(
	userId: number,
	platform: App.Platform,
	cookies: Cookies
): Promise<void> {
	const sessionId = crypto.randomUUID();
	const timestamp = Date.now();
	const data = {
		userId: userId,
		id: sessionId,
		createdAt: timestamp,
		expiresAt: timestamp + SESSION_TTL_SECONDS * 1000
	} as SessionData;
	await setSessionData(sessionId, data, platform);
	await setSessionCookie(sessionId, cookies, platform);
}

export async function destroySession(
	platform: App.Platform,
	locals: App.Locals,
	cookies: Cookies
): Promise<void> {
	const sessionId = locals.session.id;
	await deleteSessionData(sessionId, platform);
	clearSessionCookie(cookies);
}

export async function applySlidingExpiration(
	sessionData: SessionData,
	platform: App.Platform,
	cookies: Cookies
): Promise<void> {
	const timeToExpire = sessionData.expiresAt - Date.now();
	if (timeToExpire < SLIDING_THRESHOLD_SECONDS * 1000) {
		console.log(`Applying sliding expiration for session ${sessionData.id}`);
		const newSessionData = {
			...sessionData,
			expiresAt: Date.now() + SESSION_TTL_SECONDS
		};
		await setSessionData(sessionData.id, newSessionData, platform);
		await setSessionCookie(sessionData.id, cookies, platform);
	}
}
