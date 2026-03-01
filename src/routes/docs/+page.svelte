<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const providersYamlExample = `registry_url: https://registry.example.com
providers:
  - name: keycloak-home-idp-discovery
    version: v26.1.1
    sha256: "b6744e..."`;
</script>

<svelte:head>
	<title>Introduction – Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-4 text-3xl font-bold tracking-tight">How it works</h1>
		<div class="space-y-3 text-base leading-relaxed text-gray-400">
			<p>
				Keycloak extensions (called <em>providers</em>) are JAR files you drop into
				<code class="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-xs text-gray-300">/opt/keycloak/providers/</code>
				before running <code class="rounded bg-bg-secondary px-1.5 py-0.5 font-mono text-xs text-gray-300">kc.sh build</code>.
				Doing this manually across environments is fragile: you have to track download URLs,
				remember which versions you used, and trust that the file has not changed.
			</p>
			<p>
				This registry, together with a small companion tool, makes the whole process declarative.
				You describe what you want in a config file. The tool fetches it, verifies it, and places
				it where Keycloak expects it — reproducibly, in every environment, from a single source of truth.
			</p>
		</div>
	</div>

	<section>
		<h2 class="mb-6 text-xl font-semibold text-white">The three pieces</h2>
		<div class="space-y-4">

			<div class="rounded-xl border border-border bg-bg-secondary/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-indigo-600/20 px-2.5 py-0.5 font-mono text-xs text-indigo-400">1</span>
					<div>
						<h3 class="font-semibold text-white">The Registry</h3>
						<p class="text-xs text-gray-500">this site</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-gray-400">
					A searchable catalog of community Keycloak extensions. Each extension has versioned
					releases with download links, Keycloak compatibility info, and SHA-256 checksums.
					Browse it to discover extensions and to grab the exact values you need for your config.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-bg-secondary/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-indigo-600/20 px-2.5 py-0.5 font-mono text-xs text-indigo-400">2</span>
					<div>
						<h3 class="font-semibold text-white"><code class="font-mono">providers.yaml</code></h3>
						<p class="text-xs text-gray-500">your extension manifest</p>
					</div>
				</div>
				<p class="mb-4 text-sm leading-relaxed text-gray-400">
					A YAML file you keep alongside your Dockerfile declaring which extensions you need and
					at what versions. Plain text, version-controlled with your infrastructure code, readable
					by anyone on your team without knowing the download internals.
				</p>
				<CodeBlock code={providersYamlExample} lang="yaml" />
			</div>

			<div class="rounded-xl border border-border bg-bg-secondary/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-indigo-600/20 px-2.5 py-0.5 font-mono text-xs text-indigo-400">3</span>
					<div>
						<h3 class="font-semibold text-white">The fetcher tool</h3>
						<p class="text-xs text-gray-500"><code class="font-mono">ker-provider-fetcher</code></p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-gray-400">
					A minimal Docker image that reads your
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-gray-300">providers.yaml</code>,
					downloads each listed JAR from the registry, verifies it against the SHA-256 checksum
					if provided, and writes the files to the working directory. It runs as a build stage;
					nothing is installed on your machine or in your final image. The output is just JARs,
					ready to be copied into Keycloak.
				</p>
			</div>
		</div>
	</section>

	<div class="flex items-center justify-end border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-indigo-400 no-underline hover:text-indigo-300">
			Quick start →
		</a>
	</div>
</div>
