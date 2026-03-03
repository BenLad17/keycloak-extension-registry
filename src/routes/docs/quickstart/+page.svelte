<script lang="ts">
	import { page } from '$app/state';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const base = $derived(page.data.providerRegistryBase);

	const dockerfileSnippet = $derived(`FROM quay.io/keycloak/keycloak AS builder
COPY --from=${base}/keycloak-home-idp-discovery:v26.1.1 /providers/ /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]`);
</script>

<svelte:head>
	<title>Quick start - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Quick start</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			From finding an extension to a running custom Keycloak image in three steps.
		</p>
	</div>

	<ol class="space-y-8">
		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>1</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Find an extension</p>
				<p class="mt-1 text-sm text-text-secondary">
					Browse the <a href="/explore" class="text-brand hover:text-brand/80">registry</a>. On each
					extension's Overview tab, the Install section shows the exact Dockerfile to copy — with
					the correct image reference and version already filled in.
				</p>
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>2</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Paste into your Dockerfile</p>
				<p class="mt-1 mb-4 text-sm text-text-secondary">
					Copy the snippet from the extension page and use it as your Dockerfile. To add more
					extensions, duplicate the
					<code class="font-mono text-xs text-text">COPY --from=</code> line — one per extension,
					before the <code class="font-mono text-xs text-text">RUN kc.sh build</code> step.
				</p>
				<CodeBlock code={dockerfileSnippet} lang="dockerfile" />
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>3</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Build and run</p>
				<p class="mt-1 text-sm text-text-secondary">
					Run <code class="font-mono text-xs text-text">docker build .</code>. Extensions are baked
					in at build time — your running container has no dependency on the registry. To upgrade an
					extension, change the image tag in the
					<code class="font-mono text-xs text-text">COPY --from=</code> line and rebuild.
				</p>
			</div>
		</li>
	</ol>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs" class="text-sm text-brand no-underline hover:text-brand/80">← Introduction</a>
		<a href="/docs/configuration" class="text-sm text-brand no-underline hover:text-brand/80"
			>Dockerfile reference →</a
		>
	</div>
</div>
