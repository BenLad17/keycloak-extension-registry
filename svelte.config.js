import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Enable platform emulation for `vite dev` and `vite preview`
			platformProxy: {
				configPath: 'wrangler.jsonc',
				experimentalJsonConfig: true,
				persist: { path: '.wrangler/state/v3' }
			}
		})
	}
};

export default config;
