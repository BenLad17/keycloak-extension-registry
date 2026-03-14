import type { RequestHandler } from '@sveltejs/kit';
import { extension, extensionVersion, getDatabase } from '$lib/server/db';
import { getEnv } from '$lib/server/env';
import { and, eq } from 'drizzle-orm';

const PROVIDER_IMAGE_WORKFLOW = 'build-provider-image.yml';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = getEnv(platform);

	if (!env.GITHUB_WEBHOOK_SECRET) {
		return new Response('Webhook not configured', { status: 500 });
	}

	const rawBody = await request.text();

	const signature = request.headers.get('x-hub-signature-256');
	if (!signature) {
		return new Response('Missing signature', { status: 400 });
	}

	const valid = await verifySignature(env.GITHUB_WEBHOOK_SECRET, rawBody, signature);
	if (!valid) {
		return new Response('Invalid signature', { status: 401 });
	}

	const event = request.headers.get('x-github-event');
	if (event !== 'workflow_run') {
		// Acknowledge events we don't handle.
		return Response.json({ ok: true, ignored: true });
	}

	let payload: WorkflowRunPayload;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	if (
		payload.action !== 'completed' ||
		payload.workflow_run.conclusion !== 'success' ||
		!payload.workflow_run.path.endsWith(PROVIDER_IMAGE_WORKFLOW)
	) {
		return Response.json({ ok: true, ignored: true });
	}

	const inputs = payload.workflow_run.inputs;
	const slug = inputs?.slug;
	const version = inputs?.version;

	if (!slug || !version) {
		return new Response('Missing slug or version in workflow inputs', { status: 422 });
	}

	const db = getDatabase(platform);

	const [ext] = await db
		.select({ id: extension.id })
		.from(extension)
		.where(eq(extension.slug, slug))
		.limit(1);

	if (!ext) {
		// Extension may have been deleted — not an error.
		return Response.json({ ok: true, ignored: true });
	}

	await db
		.update(extensionVersion)
		.set({ providerImageBuilt: true })
		.where(and(eq(extensionVersion.extensionId, ext.id), eq(extensionVersion.version, version)));

	return Response.json({ ok: true });
};

/**
 * Validates the GitHub webhook HMAC-SHA256 signature using the WebCrypto API.
 * Uses crypto.subtle.verify for constant-time comparison, preventing timing attacks.
 */
async function verifySignature(secret: string, body: string, signature: string): Promise<boolean> {
	const PREFIX = 'sha256=';
	if (!signature.startsWith(PREFIX)) return false;

	const encoder = new TextEncoder();

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['verify']
	);

	const sigBytes = hexToBytes(signature.slice(PREFIX.length));
	if (!sigBytes) return false;

	return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body));
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
	if (hex.length % 2 !== 0) return null;
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		const byte = parseInt(hex.slice(i, i + 2), 16);
		if (isNaN(byte)) return null;
		bytes[i / 2] = byte;
	}
	return bytes;
}

// ─── Payload types ───────────────────────────────────────────────────────────

interface WorkflowRunPayload {
	action: 'requested' | 'in_progress' | 'completed';
	workflow_run: {
		id: number;
		name: string;
		path: string;
		conclusion: string | null;
		event: string;
		inputs: Record<string, string> | null;
	};
}
