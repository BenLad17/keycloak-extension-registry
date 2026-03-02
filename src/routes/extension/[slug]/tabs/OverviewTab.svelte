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

	function proxyDownloadUrl(version: string): string {
		return `/extension/${ext.slug}/${version}/download`;
	}

	function jarFilename(url: string): string {
		return url.split('/').pop() ?? 'extension.jar';
	}
</script>

<div class="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
	<!-- Left column: README -->
	<div>
		{#if readmeHtml}
			<div
				class="prose max-w-none rounded-xl border border-border bg-surface p-8"
			>
				{@html readmeHtml}
			</div>
		{:else}
			<div
				class="rounded-xl border border-border bg-surface-muted py-20 text-center text-text-secondary"
			>
				No README available.
			</div>
		{/if}
	</div>

	<!-- Sidebar -->
	<aside class="space-y-4">
		{#if latestVersion}
			<!-- Download card -->
			<Card highlight>
				<div class="mb-1 flex items-baseline justify-between">
					<span class="font-mono text-lg font-semibold text-text">{latestVersion.version}</span>
					<span class="text-sm text-text-secondary">{formatSize(latestVersion.downloadSize)}</span>
				</div>
				{#if latestVersion.keycloakVersion}
					<p class="mb-1 text-xs text-brand">For Keycloak {latestVersion.keycloakVersion}</p>
				{/if}
				<p class="mb-4 text-xs text-text-secondary/60">Published {formatDate(latestVersion.publishedAt)}</p>
				<a
					href={proxyDownloadUrl(latestVersion.version)}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85"
				>
					<Download class="h-4 w-4" />
					Download latest
				</a>
			</Card>

			<!-- Downloads chart -->
			{#if versions.length > 0}
				<Card title="Downloads">
					<div class="space-y-2.5">
						{#each visibleDownloadVersions as v}
							<div class="flex items-center gap-3">
							<span
									class="w-20 shrink-0 truncate font-mono text-xs text-text-secondary"
									title={v.version}
							>
								{v.version}
							</span>
								<div class="h-2 flex-1 overflow-hidden rounded-full bg-bg">
									<div
											class="h-2 rounded-full bg-brand/60 transition-all"
											style="width: {maxDownloads > 0
										? (((v.downloadCount ?? 0) / maxDownloads) * 100).toFixed(1)
										: 0}%"
									></div>
								</div>
								<span class="w-10 shrink-0 text-right text-xs text-text-secondary/60">
								{formatCount(v.downloadCount ?? 0)}
							</span>
							</div>
						{/each}
					</div>
					{#if versions.length > DOWNLOADS_COLLAPSED_COUNT}
						<button
								onclick={() => (downloadsExpanded = !downloadsExpanded)}
								class="mt-3 w-full text-center text-xs text-text-secondary/60 transition-colors hover:text-text-secondary"
						>
							{downloadsExpanded
									? 'Show less'
									: `Show ${versions.length - DOWNLOADS_COLLAPSED_COUNT} more…`}
						</button>
					{/if}
				</Card>
			{/if}

			<!-- Installation card -->
			<div class="overflow-hidden rounded-xl border border-border bg-surface">
				<!-- Tab bar -->
				<div class="flex items-center gap-x-5 border-b border-border px-4">
					<div class="flex items-center gap-1.5 py-3 text-xs font-medium text-text-secondary">
						<Terminal class="h-3.5 w-3.5 text-brand" />
						Install
					</div>
					<div class="ml-auto flex items-center">
						<button
							onclick={() => (installTab = 'fetcher')}
							class="py-3 pr-3 pl-2 text-xs font-medium transition-colors {installTab === 'fetcher'
								? 'border-b-2 border-brand text-text'
								: 'text-text-secondary hover:text-text'}"
						>
							Docker
						</button>
						<button
							onclick={() => (installTab = 'manual')}
							class="py-3 pr-3 pl-2 text-xs font-medium transition-colors {installTab === 'manual'
								? 'border-b-2 border-brand text-text'
								: 'text-text-secondary hover:text-text'}"
						>
							Manual
						</button>
					</div>
				</div>

				<!-- Docker tab -->
				{#if installTab === 'fetcher'}
					<div class="px-4 pt-4 pb-5">
						<p class="mb-1 text-xs font-medium text-text">
							Add to <code class="rounded bg-bg px-1 py-0.5 font-mono text-brand"
								>providers.yaml</code
							>
						</p>
						<p class="mb-3 text-xs text-text-secondary/60">
							The fetcher tool downloads and verifies the JAR at Docker build time.
						</p>
						<CodeBlock code={yamlSnippet} lang="yaml" />
						<p class="mt-3 text-xs text-text-secondary/60">
							<a href="/docs" class="text-brand hover:text-brand/80">Read the docs →</a>
						</p>
					</div>
				{/if}

				<!-- Manual tab -->
				{#if installTab === 'manual'}
					<div class="px-4 pt-4 pb-5">
						<ol class="space-y-4 text-xs">
							<li>
								<p class="mb-1.5 font-medium text-text">1. Download the JAR</p>
								<a
									href={proxyDownloadUrl(latestVersion.version)}
									class="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-text-secondary no-underline transition-colors hover:border-brand/50 hover:text-text"
								>
									<Download class="h-3 w-3" />
									{jarFilename(latestVersion.downloadUrl)}
								</a>
							</li>
							<li>
								<p class="mb-1.5 font-medium text-text">2. Copy to providers directory</p>
								<pre
									class="overflow-x-auto rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-secondary">cp {jarFilename(
										latestVersion.downloadUrl
									)} /opt/keycloak/providers/</pre>
							</li>
							<li>
								<p class="mb-1.5 font-medium text-text">3. Rebuild &amp; start Keycloak</p>
								<pre
									class="rounded-lg bg-bg px-3 py-2 font-mono text-xs text-text-secondary">./kc.sh build
./kc.sh start</pre>
							</li>
						</ol>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Metadata -->
		<Card padding="none" class="divide-y divide-border overflow-hidden text-sm">
			{#if githubSource}
				<div class="px-4 py-3">
					<p class="meta-label">Source</p>
					<a
						href="https://github.com/{githubSource.owner}/{githubSource.repo}"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 text-brand no-underline hover:text-brand/80"
					>
						<Github class="h-3.5 w-3.5" />
						{githubSource.owner}/{githubSource.repo}
					</a>
				</div>
			{/if}
			<div class="px-4 py-3">
				<p class="meta-label">Category</p>
				<p class="text-text">{ExtensionCategoryLabel[ext.category]}</p>
			</div>
			{#if firstVersion && versions.length > 1}
				<div class="px-4 py-3">
					<p class="meta-label">First release</p>
					<p class="text-text">{formatDate(firstVersion.publishedAt)}</p>
				</div>
			{/if}
			{#if ext.lastSyncedAt}
				<div class="px-4 py-3">
					<p class="meta-label">Last synced</p>
					<p class="text-text-secondary">{timeAgo(ext.lastSyncedAt)}</p>
				</div>
			{/if}
			{#if ext.lastSyncError}
				<div class="px-4 py-3">
					<p class="meta-label text-danger">Sync error</p>
					<p class="font-mono text-xs break-all text-danger">{ext.lastSyncError}</p>
				</div>
			{/if}
		</Card>

	</aside>
</div>
