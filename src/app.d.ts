// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Import types from wrangler-generated worker-configuration.d.ts
/// <reference types="../worker-configuration.d.ts" />

import type { SessionData } from '$lib/server/security/session';

declare global {
	namespace App {
		interface Platform {
			env: Env; // Uses Env from worker-configuration.d.ts
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			session: SessionData;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
