<script lang="ts">
	import { page } from '$app/state';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const base = $derived(page.data.providerRegistryBase);

	const dockerfileExample = $derived(`FROM quay.io/keycloak/keycloak AS builder
COPY --from=${base}/keycloak-home-idp-discovery:v26.1.1 /providers/ /opt/keycloak/providers/
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
				<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text"
					>kc.sh build</code
				>. Tracking download URLs, versions, and checksums manually across environments is error-prone.
			</p>
			<p>
				This registry solves that by publishing a minimal container image for every extension version
				it indexes. You reference it directly in your Dockerfile — no extra tools, no config files.
			</p>
		</div>
	</div>

	<section>
		<h2 class="mb-6 text-xl font-semibold text-text">The two pieces</h2>
		<div class="space-y-4">
			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">1</span>
					<div>
						<h3 class="font-semibold text-text">The Registry</h3>
						<p class="text-xs text-text-secondary">this site</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Discovers and indexes community Keycloak extensions from GitHub Releases and Maven Central.
					For every version it finds, it publishes a minimal OCI image containing just the JAR,
					verified against its SHA-256 digest.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">2</span>
					<div>
						<h3 class="font-semibold text-text">Your Dockerfile</h3>
						<p class="text-xs text-text-secondary">one COPY line per extension</p>
					</div>
				</div>
				<p class="mb-4 text-sm leading-relaxed text-text-secondary">
					Reference the provider image directly with
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">COPY --from=</code>.
					Docker pulls the image at build time and copies the JAR into your Keycloak builder stage.
					Adding another extension is one more line — the pattern never changes.
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
