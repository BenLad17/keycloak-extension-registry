import { error, type Handle } from '@sveltejs/kit';
import { clearSessionCookie, getSessionIdFromCookie } from '$lib/server/security/session-cookie';
import { getSessionData } from '$lib/server/security/session-store';
import { applySlidingExpiration } from '$lib/server/security/session';

export const handle: Handle = async ({ event, resolve }) => {
	const platform = event.platform;
	if (!platform) {
		throw error(500, 'Platform not available');
	}

	let sessionId;
	try {
		sessionId = await getSessionIdFromCookie(event.cookies, platform);
	} catch (err) {
		clearSessionCookie(event.cookies);
	}
	if (sessionId) {
		const sessionData = await getSessionData(sessionId, platform);
		if (sessionData) {
			event.locals.session = sessionData;
			await applySlidingExpiration(sessionData, platform, event.cookies);
		}
	}

	const response = await resolve(event);
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	return response;
};
