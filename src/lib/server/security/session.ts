import { deleteSessionData, setSessionData } from '$lib/server/security/session-store';
import { clearSessionCookie, setSessionCookie } from '$lib/server/security/session-cookie';
import type { Cookies } from '@sveltejs/kit';

export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SLIDING_THRESHOLD_SECONDS = Math.floor(SESSION_TTL_SECONDS / 2);

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
	const timestampEpochSeconds = epochSecondsNow();
	const data = {
		userId: userId,
		id: sessionId,
		createdAt: timestampEpochSeconds,
		expiresAt: timestampEpochSeconds + SESSION_TTL_SECONDS
	} as SessionData;
	await setSessionData(data, platform);
	await setSessionCookie(data, cookies, platform);
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
	const currentEpochSeconds = epochSecondsNow();
	const timeToExpire = sessionData.expiresAt - currentEpochSeconds;
	if (timeToExpire < SLIDING_THRESHOLD_SECONDS) {
		console.log(`Applying sliding expiration for session ${sessionData.id}`);
		const newSessionData = {
			...sessionData,
			expiresAt: currentEpochSeconds + SESSION_TTL_SECONDS
		};
		await setSessionData(newSessionData, platform);
		await setSessionCookie(newSessionData, cookies, platform);
	}
}

function epochSecondsNow(): number {
	return Math.floor(Date.now() / 1000);
}
