<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Github, Download, Package, ChevronDown, Terminal } from 'lucide-svelte';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Card from '$lib/components/Card.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { formatCount, formatSize, formatDate, timeAgo } from '$lib/utils/format';
	import type { Extension, ExtensionVersion, GithubCodeSource } from '$lib/server/db';
	import { generateYamlSnippet } from '$lib/types/providers-config';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	let {
		extension: ext,
		versions,
		latestVersion,
		firstVersion,
		githubSource,
		maxDownloads,
		readmeHtml
	}: {
		extension: Extension;
		versions: ExtensionVersion[];
		latestVersion: ExtensionVersion | null;
		firstVersion: ExtensionVersion | null;
		githubSource: GithubCodeSource | null;
		maxDownloads: number;
		readmeHtml: string | null;
	} = $props();

	const DOWNLOADS_COLLAPSED_COUNT = 5;
	let downloadsExpanded = $state(false);
	const visibleDownloadVersions = $derived(
		downloadsExpanded ? versions : versions.slice(0, DOWNLOADS_COLLAPSED_COUNT)
	);

	let showInstall = $state(true);
	let installTab = $state<'fetcher' | 'manual'>('fetcher');

	const registryUrl = $derived(
		typeof globalThis.location !== 'undefined' ? globalThis.location.origin : ''
	);

	const yamlSnippet = $derived(
		latestVersion
			? generateYamlSnippet(
					{ name: ext.slug, version: latestVersion.version, sha256: latestVersion.digest },
					registryUrl
				)
			: ''
	);

	function jarFilename(url: string): string {
		return url.split('/').pop() ?? 'extension.jar';
	}
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_300px]">
	<!-- Left column -->
	<div class="space-y-4">
		<!-- README -->
		{#if readmeHtml}
			<div class="prose prose-invert max-w-none rounded-2xl border border-border bg-bg-secondary p-8">
				{@html readmeHtml}
			</div>
		{:else}
			<div class="rounded-2xl border border-border bg-bg-secondary/50 py-20 text-center text-gray-500">
				No README available.
			</div>
		{/if}

		<!-- Install instructions -->
		{#if latestVersion}
			<div class="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
				<button
					onclick={() => (showInstall = !showInstall)}
					class="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-white/5"
				>
					<div class="flex items-center gap-2 text-sm font-medium text-white">
						<Terminal class="h-4 w-4 text-indigo-400" />
						Installation
					</div>
					<ChevronDown class="h-4 w-4 text-gray-500 transition-transform duration-200 {showInstall ? 'rotate-180' : ''}" />
				</button>
				{#if showInstall}
					<div transition:slide={{ duration: 200 }} class="border-t border-border">
						<!-- Inner tab bar -->
						<div class="flex items-center border-b border-border px-6">
							<button
								onclick={() => (installTab = 'fetcher')}
								class="py-3 pr-5 text-xs font-medium transition-colors {installTab === 'fetcher' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500 hover:text-gray-300'}"
							>
								Docker
							</button>
							<button
								onclick={() => (installTab = 'manual')}
								class="py-3 pr-5 text-xs font-medium transition-colors {installTab === 'manual' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500 hover:text-gray-300'}"
							>
								Manual
							</button>
							<span class="ml-auto text-xs text-gray-600">Docker is recommended</span>
						</div>

						<!-- Docker tab -->
						{#if installTab === 'fetcher'}
							<div class="px-6 pb-6 pt-5">
								<p class="mb-1 font-medium text-gray-300">Add to your <code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-indigo-300">providers.yaml</code></p>
								<p class="mb-3 text-xs text-gray-600">Then reference this file in a multi-stage Dockerfile — the fetcher tool downloads and verifies the JAR at build time.</p>
								<CodeBlock code={yamlSnippet} lang="yaml" />
								<p class="mt-3 text-xs text-gray-600">
									New to this workflow?
									<a href="/docs" class="text-indigo-400 hover:text-indigo-300">Read the docs →</a>
								</p>
							</div>
						{/if}

						<!-- Manual install tab -->
						{#if installTab === 'manual'}
							<div class="px-6 pb-6 pt-5">
								<ol class="space-y-5 text-sm">
									<li>
										<p class="mb-2 font-medium text-gray-300">1. Download the JAR</p>
										<a
											href={latestVersion.downloadUrl}
											download
											class="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-400 no-underline transition-colors hover:border-indigo-500/50 hover:text-white"
										>
											<Download class="h-3.5 w-3.5" />
											{jarFilename(latestVersion.downloadUrl)}
										</a>
									</li>
									<li>
										<p class="mb-2 font-medium text-gray-300">2. Copy to Keycloak providers directory</p>
										<pre class="rounded-lg bg-bg px-4 py-3 font-mono text-xs text-gray-400">cp {jarFilename(latestVersion.downloadUrl)} /opt/keycloak/providers/</pre>
									</li>
									<li>
										<p class="mb-2 font-medium text-gray-300">3. Rebuild Keycloak</p>
										<pre class="rounded-lg bg-bg px-4 py-3 font-mono text-xs text-gray-400">./kc.sh build</pre>
									</li>
									<li>
										<p class="mb-2 font-medium text-gray-300">4. Start Keycloak</p>
										<pre class="rounded-lg bg-bg px-4 py-3 font-mono text-xs text-gray-400">./kc.sh start</pre>
									</li>
								</ol>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Sidebar -->
	<aside class="space-y-4">
		{#if latestVersion}
			<Card highlight>
				<div class="mb-1 flex items-baseline justify-between">
					<span class="font-mono text-lg font-semibold text-white">{latestVersion.version}</span>
					<span class="text-sm text-gray-500">{formatSize(latestVersion.downloadSize)}</span>
				</div>
				{#if latestVersion.keycloakVersion}
					<p class="mb-1 text-xs text-indigo-400">For Keycloak {latestVersion.keycloakVersion}</p>
				{/if}
				<p class="mb-4 text-xs text-gray-600">Published {formatDate(latestVersion.publishedAt)}</p>
				<a
					href={latestVersion.downloadUrl}
					download
					class="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-indigo-500"
				>
					<Download class="h-4 w-4" />
					Download latest
				</a>
			</Card>
		{/if}

		<Card padding="none" class="divide-y divide-border overflow-hidden text-sm">
			{#if githubSource}
				<div class="px-4 py-3">
					<p class="meta-label">Source</p>
					<a
						href="https://github.com/{githubSource.owner}/{githubSource.repo}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 text-indigo-400 no-underline hover:text-indigo-300"
					>
						<Github class="h-3.5 w-3.5" />
						{githubSource.owner}/{githubSource.repo}
					</a>
				</div>
			{/if}
			<div class="px-4 py-3">
				<p class="meta-label">Category</p>
				<p class="text-gray-300">{ExtensionCategoryLabel[ext.category]}</p>
			</div>
			{#if firstVersion && versions.length > 1}
				<div class="px-4 py-3">
					<p class="meta-label">First release</p>
					<p class="text-gray-300">{formatDate(firstVersion.publishedAt)}</p>
				</div>
			{/if}
			{#if ext.lastSyncedAt}
				<div class="px-4 py-3">
					<p class="meta-label">Last synced</p>
					<p class="text-gray-500">{timeAgo(ext.lastSyncedAt)}</p>
				</div>
			{/if}
			{#if ext.lastSyncError}
				<div class="px-4 py-3">
					<p class="meta-label" style="color: rgb(220 38 38 / 0.8)">Sync error</p>
					<p class="break-all font-mono text-xs text-red-400">{ext.lastSyncError}</p>
				</div>
			{/if}
		</Card>

		{#if versions.length > 0}
			<Card title="Downloads">
				<p class="mb-3 text-xs text-gray-600">{(ext.downloadCount ?? 0).toLocaleString()} total across all versions</p>
				<div class="space-y-2.5">
					{#each visibleDownloadVersions as v}
						<div class="flex items-center gap-3">
							<span class="w-20 shrink-0 truncate font-mono text-xs text-gray-500" title={v.version}>
								{v.version}
							</span>
							<div class="h-2 flex-1 overflow-hidden rounded-full bg-bg">
								<div
									class="h-2 rounded-full bg-indigo-500/60 transition-all"
									style="width: {maxDownloads > 0 ? (((v.downloadCount ?? 0) / maxDownloads) * 100).toFixed(1) : 0}%"
								></div>
							</div>
							<span class="w-10 shrink-0 text-right text-xs text-gray-600">
								{formatCount(v.downloadCount ?? 0)}
							</span>
						</div>
					{/each}
				</div>
				{#if versions.length > DOWNLOADS_COLLAPSED_COUNT}
					<button
						onclick={() => (downloadsExpanded = !downloadsExpanded)}
						class="mt-3 w-full text-center text-xs text-gray-600 transition-colors hover:text-gray-400"
					>
						{downloadsExpanded ? 'Show less' : `Show ${versions.length - DOWNLOADS_COLLAPSED_COUNT} more…`}
					</button>
				{/if}
			</Card>
		{/if}
	</aside>
</div>
