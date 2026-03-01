<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const multiProviderExample = `providers:
  - name: keycloak-home-idp-discovery
    version: v26.1.1
  - name: my-other-extension
    version: v1.0.0
    sha256: "abc123..."`;
</script>

<svelte:head>
	<title>FAQ – Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-3xl font-bold tracking-tight">FAQ</h1>
		<p class="text-base leading-relaxed text-gray-400">
			Common questions about the registry and the fetcher tool.
		</p>
	</div>

	<div class="space-y-4">
		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">Do I need the SHA-256?</p>
			<p class="text-sm text-gray-400">
				No, it is optional. But it is strongly recommended for production builds. Without it the
				fetcher downloads whatever the registry returns. With it, the build fails if the artifact
				has changed, catching both accidental and malicious modifications before they reach your
				image.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">Can I list multiple extensions?</p>
			<p class="mb-3 text-sm text-gray-400">
				Yes. Add as many entries as you need under <code class="font-mono text-xs text-gray-300"
					>providers</code
				>. The fetcher processes them all in one run:
			</p>
			<CodeBlock code={multiProviderExample} lang="yaml" />
		</div>

		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">
				Why pin to an exact version instead of using "latest"?
			</p>
			<p class="text-sm text-gray-400">
				Reproducibility. A Docker build from three months ago should produce the same image as one
				run today. A "latest" shorthand would silently update extensions between builds, making
				rollbacks harder and breaking the auditability of what is in each image.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">Where do the JARs end up?</p>
			<p class="text-sm text-gray-400">
				The fetcher writes each JAR to its working directory as
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-gray-300">{'{name}'}.jar</code
				>. In the example Dockerfile,
				<code class="font-mono text-xs text-gray-300">WORKDIR /work</code>
				is set so JARs land in <code class="font-mono text-xs text-gray-300">/work/*.jar</code>,
				then get copied into the builder stage.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">
				Which Keycloak version does an extension support?
			</p>
			<p class="text-sm text-gray-400">
				Each version entry in the Versions tab shows a compatibility badge. Pick a release that
				matches the Keycloak version in your base image. The Installation card always pre-selects
				the latest available release.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-bg-secondary/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-gray-200">Does the fetcher run at container startup?</p>
			<p class="text-sm text-gray-400">
				No. It runs only during <code class="font-mono text-xs text-gray-300">docker build</code>
				as a multi-stage build step. Your running container has no dependency on the registry or the fetcher
				tool; the JARs are baked in at build time.
			</p>
		</div>
	</div>

	<div class="flex items-center justify-start border-t border-border pt-6">
		<a
			href="/docs/configuration"
			class="text-sm text-indigo-400 no-underline hover:text-indigo-300"
		>
			← Configuration
		</a>
	</div>
</div>
