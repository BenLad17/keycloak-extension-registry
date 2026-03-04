<script lang="ts">
	import { Github, Download } from 'lucide-svelte';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Card from '$lib/components/Card.svelte';
	import { formatCount, formatSize, formatDate, timeAgo } from '$lib/utils/format';
	import type { Extension, ExtensionVersion, GithubCodeSource } from '$lib/server/db';
	import { providerImageRef, generateCopyLine } from '$lib/types/providers-config';
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	let {
		extension: ext,
		versions,
		latestVersion,
		firstVersion,
		githubSource,
		maxDownloads,
		readmeHtml,
		providerRegistryBase,
		canManage
	}: {
		extension: Extension;
		versions: ExtensionVersion[];
		latestVersion: ExtensionVersion | null;
		firstVersion: ExtensionVersion | null;
		githubSource: GithubCodeSource | null;
		maxDownloads: number;
		readmeHtml: string | null;
		providerRegistryBase: string;
		canManage: boolean;
	} = $props();

	const DOWNLOADS_COLLAPSED_COUNT = 5;
	let downloadsExpanded = $state(false);
	const visibleDownloadVersions = $derived(
		downloadsExpanded ? versions : versions.slice(0, DOWNLOADS_COLLAPSED_COUNT)
	);

	const copyLine = $derived(
		latestVersion ? generateCopyLine(providerImageRef(providerRegistryBase, ext.slug, latestVersion.version)) : ''
	);

	function proxyDownloadUrl(version: string): string {
		return `/extension/${ext.slug}/${version}/download`;
	}
</script>

<div class="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-[1fr_340px]">
	<!-- Left column: README -->
	<div>
		{#if readmeHtml}
			<div
				class="prose max-w-none rounded-xl border border-border bg-surface p-4 sm:p-6 md:p-8"
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
					<p class="mb-1 text-xs text-brand">Built against Keycloak {latestVersion.keycloakVersion}</p>
				{/if}
				<p class="mb-4 text-xs text-text-secondary/60">Published {formatDate(latestVersion.publishedAt)}</p>
				<a
					href={proxyDownloadUrl(latestVersion.version)}
					class="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85"
				>
					<Download class="h-4 w-4" />
					Download JAR
				</a>
			</Card>

			<!-- Downloads chart -->
			{#if versions.length > 0}
				<Card title="Downloads">
					<div class="space-y-2.5">
						{#each visibleDownloadVersions as v}
							<div class="flex items-center gap-3">
								<span
									class="min-w-0 flex-1 truncate font-mono text-xs text-text-secondary"
									title={v.version}
								>
									{v.version}
								</span>
								<div class="h-2 w-16 overflow-hidden rounded-full bg-bg sm:w-24">
									<div
										class="h-2 rounded-full bg-brand/60 transition-all"
										style="width: {maxDownloads > 0
											? (((v.downloadCount ?? 0) / maxDownloads) * 100).toFixed(1)
											: 0}%"
									></div>
								</div>
								<span class="shrink-0 text-right text-xs text-text-secondary/60">
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

			<!-- Install card -->
			<div class="overflow-hidden rounded-xl border border-border bg-surface">
				<div class="flex items-baseline justify-between border-b border-border px-4 py-3">
					<p class="text-xs font-semibold text-text">Docker install</p>
					<span class="text-xs text-text-secondary/50">via OCI image</span>
				</div>
				<div class="px-4 pt-4 pb-5">
					<CodeBlock code={copyLine} lang="dockerfile" />
					<p class="mt-3 text-xs text-text-secondary/60">
						Add this line to your Dockerfile before the build step. <a href="/docs/quickstart" class="text-brand hover:text-brand/80">Full guide →</a>
					</p>
				</div>
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
			{#if ext.lastSyncError && canManage}
				<div class="px-4 py-3">
					<p class="meta-label text-danger">Sync error</p>
					<p class="font-mono text-xs break-all text-danger">{ext.lastSyncError}</p>
				</div>
			{/if}
		</Card>

	</aside>
</div>
