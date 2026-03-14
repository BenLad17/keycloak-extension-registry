<script lang="ts">
	import { page } from '$app/state';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const base = $derived(page.data.providerRegistryBase);

	const dockerfileExample = $derived(`FROM quay.io/keycloak/keycloak AS builder
COPY --from=${base}/home-idp-discovery:v26.1.0 /providers/ /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]`);
</script>

<svelte:head>
	<title>Introduction - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-4 text-2xl font-semibold tracking-tight">How it works</h1>
		<div class="space-y-3 text-base leading-relaxed text-text-secondary">
			<p>
				Keycloak extensions (called <em>providers</em>) are JAR files placed in
				<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text"
					>/opt/keycloak/providers/</code
				>
				before running
				<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text">kc.sh build</code
				>. Finding and keeping track of community extensions across GitHub and Maven Central is
				tedious.
			</p>
			<p>
				This registry is a central index of community extensions. You can browse by category, read
				changelogs, download JARs directly from each extension's page, or use the Docker integration
				to pull them straight into your image.
			</p>
		</div>
	</div>

	<section>
		<h2 class="mb-6 text-xl font-semibold text-text">Installing extensions</h2>
		<div class="space-y-4">
			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">A</span>
					<div>
						<h3 class="font-semibold text-text">Manual download</h3>
						<p class="text-xs text-text-secondary">simplest option</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Go to any extension's Versions tab and click Download to get the JAR. Drop it into your
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
						>/opt/keycloak/providers/</code
					>
					folder and run
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">kc.sh build</code>.
					Each version shows its SHA-256 digest so you can verify the file before use.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">B</span>
					<div>
						<h3 class="font-semibold text-text">Docker integration</h3>
						<p class="text-xs text-text-secondary">recommended for containerised setups</p>
					</div>
				</div>
				<p class="mb-4 text-sm leading-relaxed text-text-secondary">
					For every extension version indexed, the registry publishes a minimal OCI image containing
					just the JAR. Reference it with
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">COPY --from=</code>
					in your Dockerfile. Docker pulls the image at build time, no extra tools needed. Adding another
					extension is one more line. The pattern never changes.
				</p>
				<CodeBlock code={dockerfileExample} lang="dockerfile" />
			</div>
		</div>
	</section>

	<div class="flex items-center justify-end border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-brand no-underline hover:text-brand/80">
			Quick start →
		</a>
	</div>
</div>
