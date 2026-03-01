interface Env {
	REGISTRY_URL: string;
	CRON_SECRET: string;
}

export default {
	async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
		const req = new Request(`${env.REGISTRY_URL}/api/cron/sync`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${env.CRON_SECRET}` }
		});
		ctx.waitUntil(fetch(req));
	}
} satisfies ExportedHandler<Env>;
