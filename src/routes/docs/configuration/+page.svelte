<script lang="ts">
	import { page } from '$app/state';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const base = $derived(page.data.providerRegistryBase);

	const singleExtension = $derived(`FROM quay.io/keycloak/keycloak AS builder
COPY --from=${base}/keycloak-home-idp-discovery:v26.1.1 /providers/ /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]`);

	const multipleExtensions = $derived(`FROM quay.io/keycloak/keycloak AS builder
COPY --from=${base}/keycloak-home-idp-discovery:v26.1.1 /providers/ /opt/keycloak/providers/
COPY --from=${base}/keycloak-magic-link:v2.0.0 /providers/ /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]`);
</script>

<svelte:head>
	<title>Dockerfile reference - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Dockerfile reference</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			How the Dockerfile pattern works and how to extend it.
		</p>
	</div>

	<!-- Single extension -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">Single extension</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Copy the snippet from any extension's Overview tab. It is always in this form:
		</p>
		<CodeBlock code={singleExtension} lang="dockerfile" />
	</section>

	<!-- Multiple extensions -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">Multiple extensions</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Add one
			<code class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text">COPY --from=</code>
			line per extension, before the
			<code class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text"
				>RUN kc.sh build</code
			> step. The pattern is identical regardless of how many extensions you include.
		</p>
		<CodeBlock code={multipleExtensions} lang="dockerfile" />
	</section>

	<!-- Stage breakdown -->
	<section>
		<h2 class="mb-4 text-xl font-semibold text-text">What each stage does</h2>
		<div class="space-y-3">
			<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
				<p class="mb-1 font-mono text-xs text-brand">builder stage</p>
				<p class="text-sm text-text-secondary">
					Starts from the official Keycloak image. Each
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">COPY --from=</code>
					pulls a minimal provider image (published by this registry) and copies the JAR into
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
						>/opt/keycloak/providers/</code
					>.
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">kc.sh build</code>
					then augments and optimises Keycloak's classpath for the installed providers — this is required
					for the <code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">--optimized</code> start flag.
				</p>
			</div>
			<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
				<p class="mb-1 font-mono text-xs text-brand">final stage</p>
				<p class="text-sm text-text-secondary">
					Starts from a fresh Keycloak image and copies in only the built output. The build tooling
					and provider images never end up in your running container.
				</p>
			</div>
		</div>
	</section>

	<!-- Provider images -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">How provider images work</h2>
		<p class="text-sm leading-relaxed text-text-secondary">
			When this registry syncs a new extension version, it automatically builds and publishes a
			minimal OCI image containing only the JAR file at
			<code class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text">/providers/</code>.
			The image tag is the exact extension version, so pinning is automatic. Images are public and
			free to pull with no rate limits.
		</p>
	</section>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-brand no-underline hover:text-brand/80"
			>← Quick start</a
		>
		<a href="/docs/faq" class="text-sm text-brand no-underline hover:text-brand/80">FAQ →</a>
	</div>
</div>
