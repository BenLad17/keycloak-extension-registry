<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const dockerfileSnippet = `FROM ghcr.io/benlad17/keycloak-extension-registry/ker-provider-fetcher AS provider-fetcher
WORKDIR /work
COPY providers.yaml /work/providers.yaml
RUN ["/kc-provider-fetcher", "/work/providers.yaml"]

FROM quay.io/keycloak/keycloak AS builder
WORKDIR /opt/keycloak
COPY --chown=keycloak:keycloak --from=provider-fetcher /work/*.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak
COPY --from=builder /opt/keycloak/ /opt/keycloak/
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized"]`;
</script>

<svelte:head>
	<title>Quick start - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Quick start</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			From finding an extension to running a custom Keycloak image in five steps.
		</p>
	</div>

	<ol class="space-y-8">
		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>1</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Browse the registry</p>
				<p class="mt-1 text-sm text-text-secondary">
					Find an extension on the <a href="/" class="text-brand hover:text-brand/80"
						>Browse</a
					> page. Check Keycloak version compatibility, read the README, and review its release history
					in the Versions tab.
				</p>
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>2</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Copy the snippet from the extension page</p>
				<p class="mt-1 text-sm text-text-secondary">
					The Installation card on each extension's Overview tab generates a ready-to-use YAML
					snippet with the slug, version, and checksum already filled in. Click the Docker tab and
					copy it.
				</p>
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>3</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">
					Paste it into <code
						class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text"
						>providers.yaml</code
					>
				</p>
				<p class="mt-1 text-sm text-text-secondary">
					Add it alongside any other extensions you use. Keep this file in your repository next to
					your Dockerfile. See the <a
						href="/docs/configuration"
						class="text-brand hover:text-brand/80">Configuration</a
					> page for the full field reference.
				</p>
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>4</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Use the fetcher in a multi-stage Dockerfile</p>
				<p class="mt-1 mb-4 text-sm text-text-secondary">
					The fetcher runs as the first build stage, downloads and verifies the JARs, then the
					builder stage copies them in. The final image is lean; the fetcher tool never ends up in
					production.
				</p>
				<CodeBlock code={dockerfileSnippet} lang="dockerfile" />
			</div>
		</li>

		<li class="flex gap-4">
			<span
				class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
				>5</span
			>
			<div class="min-w-0 flex-1">
				<p class="font-medium text-text">Build and run</p>
				<p class="mt-1 text-sm text-text-secondary">
					Run <code class="font-mono text-xs text-text-secondary">docker build .</code> and the extensions
					are resolved at build time. To upgrade an extension, change its version in
					<code class="font-mono text-xs text-text-secondary">providers.yaml</code> and rebuild.
				</p>
			</div>
		</li>
	</ol>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs" class="text-sm text-brand no-underline hover:text-brand/80">
			← Introduction
		</a>
		<a
			href="/docs/configuration"
			class="text-sm text-brand no-underline hover:text-brand/80"
		>
			Configuration →
		</a>
	</div>
</div>
