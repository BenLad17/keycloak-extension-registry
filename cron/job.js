worker_default.scheduled = async (event, env, ctx) => {
	const req = new Request(`${env.REGISTRY_URL}/api/cron/sync`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${env.CRON_SECRET}` }
	});
	await worker_default.fetch(req, env, ctx);
};
