import { getEnv } from '$lib/server/env';
import { type SessionData } from '$lib/server/security/session';

export async function getSessionData(
	sessionId: string,
	platform: App.Platform
): Promise<SessionData | null> {
	const env = getEnv(platform);
	const sessionStore = env.SESSIONS;
	const sessionContent = await sessionStore.get(sessionId);
	if (!sessionContent) return null;
	try {
		return JSON.parse(sessionContent) as SessionData;
	} catch {
		// Corrupted or unrecognizable session data: treat as no session.
		await sessionStore.delete(sessionId);
		return null;
	}
}

export async function setSessionData(data: SessionData, platform: App.Platform): Promise<void> {
	const env = getEnv(platform);
	const sessionStore = env.SESSIONS;
	await sessionStore.put(data.id, JSON.stringify(data), { expiration: data.expiresAt });
}

export async function deleteSessionData(sessionId: string, platform: App.Platform): Promise<void> {
	const env = getEnv(platform);
	const sessionStore = env.SESSIONS;
	await sessionStore.delete(sessionId);
}
