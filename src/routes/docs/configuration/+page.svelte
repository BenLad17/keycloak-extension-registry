<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';
	import { page } from '$app/state';

	const schemaUrl = $derived(`${page.url.origin}/providers.schema.json`);
</script>

<svelte:head>
	<title>Configuration - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Configuration</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			Reference for <code
				class="rounded bg-surface px-1.5 py-0.5 font-mono text-sm text-text"
				>providers.yaml</code
			>
			and how to find the values you need from the registry.
		</p>
	</div>

	<!-- Field reference -->
	<section>
		<h2 class="mb-1 text-xl font-semibold text-text">Field reference</h2>
		<p class="mb-4 text-sm text-text-secondary">All fields supported by the config file.</p>
		<div class="overflow-hidden rounded-xl border border-border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-surface/60">
						<th class="px-4 py-3 text-left font-medium text-text">Field</th>
						<th class="px-4 py-3 text-left font-medium text-text">Type</th>
						<th class="px-4 py-3 text-left font-medium text-text">Required</th>
						<th class="px-4 py-3 text-left font-medium text-text">Description</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border text-text-secondary">
					<tr>
						<td class="px-4 py-3 font-mono text-xs text-brand">registry_url</td>
						<td class="px-4 py-3 text-xs">string</td>
						<td class="px-4 py-3 text-xs">No</td>
						<td class="px-4 py-3 text-xs"
							>Base URL of the registry to download from. Defaults to the official registry if
							omitted.</td
						>
					</tr>
					<tr>
						<td class="px-4 py-3 font-mono text-xs text-brand">providers</td>
						<td class="px-4 py-3 text-xs">array</td>
						<td class="px-4 py-3 text-xs">Yes</td>
						<td class="px-4 py-3 text-xs">List of extensions to download.</td>
					</tr>
					<tr>
						<td class="px-4 py-3 font-mono text-xs text-brand">providers[].name</td>
						<td class="px-4 py-3 text-xs">string</td>
						<td class="px-4 py-3 text-xs">Yes</td>
						<td class="px-4 py-3 text-xs"
							>The extension slug shown in the registry URL and on the extension page.</td
						>
					</tr>
					<tr>
						<td class="px-4 py-3 font-mono text-xs text-brand">providers[].version</td>
						<td class="px-4 py-3 text-xs">string</td>
						<td class="px-4 py-3 text-xs">Yes</td>
						<td class="px-4 py-3 text-xs"
							>The exact version to download (e.g. <code class="font-mono text-text-secondary"
								>v26.1.1</code
							>). Pinning to an exact version is intentional; there is no "latest" shorthand.</td
						>
					</tr>
					<tr>
						<td class="px-4 py-3 font-mono text-xs text-brand">providers[].sha256</td>
						<td class="px-4 py-3 text-xs">string</td>
						<td class="px-4 py-3 text-xs">No</td>
						<td class="px-4 py-3 text-xs"
							>SHA-256 hex digest of the JAR. If provided, the fetcher rejects the download if the
							checksum does not match.</td
						>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- Finding values -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">Finding the right values</h2>
		<p class="mb-4 text-sm text-text-secondary">
			The Installation card on each extension page generates a pre-filled snippet, so you rarely
			need to look these up manually. Here is where each value comes from:
		</p>
		<ul class="space-y-4 text-sm">
			<li class="flex gap-3">
				<code
					class="mt-0.5 shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brand"
					>name</code
				>
				<p class="text-text-secondary">
					The extension slug, visible at the end of the extension URL:
					<code class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text"
						>/extension/<em>keycloak-home-idp-discovery</em></code
					>. Use the <a href="/" class="text-brand hover:text-brand/80">Browse</a> page to find
					extensions.
				</p>
			</li>
			<li class="flex gap-3">
				<code
					class="mt-0.5 shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brand"
					>version</code
				>
				<p class="text-text-secondary">
					Shown in the Versions tab on each extension page. The Installation card pre-fills the
					latest release automatically.
				</p>
			</li>
			<li class="flex gap-3">
				<code
					class="mt-0.5 shrink-0 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-brand"
					>sha256</code
				>
				<p class="text-text-secondary">
					Shown in the version detail panel in the Versions tab. Each release lists its checksum;
					copy it from there into your config.
				</p>
			</li>
		</ul>
	</section>

	<!-- IDE autocomplete -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">IDE autocomplete</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Add this comment as the first line of your
			<code class="rounded bg-surface px-1 py-0.5 font-mono text-xs text-text"
				>providers.yaml</code
			>
			to get schema-based field completion and inline validation in VS Code, IntelliJ, and any editor
			that supports the YAML Language Server:
		</p>
		<CodeBlock code={`# yaml-language-server: $schema=${schemaUrl}`} lang="yaml" />
	</section>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-brand no-underline hover:text-brand/80">
			← Quick start
		</a>
		<a href="/docs/faq" class="text-sm text-brand no-underline hover:text-brand/80">
			FAQ →
		</a>
	</div>
</div>
