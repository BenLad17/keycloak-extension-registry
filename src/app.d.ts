// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// Import types from wrangler-generated worker-configuration.d.ts
/// <reference types="../worker-configuration.d.ts" />

declare global {
	namespace App {
		interface Platform {
			env: Env; // Uses Env from worker-configuration.d.ts
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			// Session data (populated in hooks.server.ts)
			user?: {
				id: number;
				githubId: number;
				username: string;
				avatarUrl: string | null;
			};
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
