<script lang="ts">
	import {
		Github,
		BookOpen,
		History,
		ScrollText,
		FileCode2,
		AlertTriangle,
		ArrowLeft,
		Pencil,
		CheckCircle
	} from 'lucide-svelte';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Badge from '$lib/components/Badge.svelte';
	import { timeAgo, formatNumber, renderMarkdown } from '$lib/utils/format';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import OverviewTab from './tabs/OverviewTab.svelte';
	import VersionsTab from './tabs/VersionsTab.svelte';
	import ChangelogTab from './tabs/ChangelogTab.svelte';
	import CodeTab from './tabs/CodeTab.svelte';

	let { data } = $props();

	const ext = $derived(data.extension);
	const versions = $derived(data.versions);
	const githubSource = $derived(data.githubSource);
	const canManage = $derived(data.canManage);
	const providerRegistryBase = $derived(data.providerRegistryBase);
	const latestVersion = $derived(versions[0] ?? null);
	const justPublished = $derived(page.url.searchParams.get('published') === 'true');
	const firstVersion = $derived(versions[versions.length - 1] ?? null);
	const maxDownloads = $derived(Math.max(...versions.map((v) => v.downloadCount ?? 0), 1));
	const readmeHtml = $derived(ext.readme ? renderMarkdown(ext.readme) : null);

	let activeTab = $state<'overview' | 'versions' | 'changelog' | 'code'>('overview');
	let tabBarEl = $state<HTMLElement | null>(null);

	async function switchTab(id: typeof activeTab) {
		activeTab = id;
		await tick();
		tabBarEl?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
	}

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: BookOpen },
		{ id: 'versions', label: 'Versions', icon: History },
		{ id: 'changelog', label: 'Changelog', icon: ScrollText },
		{ id: 'code', label: 'Code', icon: FileCode2 }
	] as const;
</script>

<svelte:head>
	<title>{ext.name} - Keycloak Extension Registry</title>
	<meta name="description" content={ext.description ?? `${ext.name} - a community Keycloak extension.`} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content="{ext.name} - Keycloak Extension Registry" />
	<meta property="og:description" content={ext.description ?? `${ext.name} - a community Keycloak extension.`} />
	<meta name="twitter:title" content="{ext.name} - Keycloak Extension Registry" />
	<meta name="twitter:description" content={ext.description ?? `${ext.name} - a community Keycloak extension.`} />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-6 sm:py-10">
	<!-- Top bar: back link + repo link -->
	<div class="mb-6 flex items-center justify-between gap-3">
		<a
			href="/explore"
			class="inline-flex items-center gap-1.5 text-sm text-text-secondary no-underline transition-colors hover:text-text"
		>
			<ArrowLeft class="h-4 w-4" />
			Browse extensions
		</a>
		{#if githubSource}
			<a
				href="https://github.com/{githubSource.owner}/{githubSource.repo}"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 text-sm text-text-secondary no-underline hover:text-text"
			>
				<Github class="h-4 w-4" />
				{githubSource.owner}/{githubSource.repo}
			</a>
		{/if}
	</div>

	<!-- Published banner -->
	{#if justPublished}
		<div
			class="mb-6 flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
		>
			<CheckCircle class="h-4 w-4 shrink-0" />
			Extension published successfully. Versions will sync in the background.
		</div>
	{/if}

	<!-- Archived banner -->
	{#if ext.status === 'archived'}
		<div
			class="mb-6 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning"
		>
			<AlertTriangle class="h-4 w-4 shrink-0" />
			This extension is archived and no longer maintained. It may not work with recent Keycloak versions.
		</div>
	{/if}

	<!-- Header -->
	<div class="mb-8 space-y-2">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<div class="flex flex-wrap items-center gap-2">
				<Badge size="md">{ExtensionCategoryLabel[ext.category]}</Badge>
				{#if latestVersion?.deprecated}
					<Badge variant="danger" size="md">Deprecated</Badge>
				{/if}
			</div>
			{#if canManage}
				<a
					href="/extension/{ext.slug}/edit"
					class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-secondary no-underline transition-colors hover:border-brand/50 hover:text-text"
				>
					<Pencil class="h-3.5 w-3.5" />
					Edit
				</a>
			{/if}
		</div>

		<h1 class="text-2xl font-semibold tracking-tight">{ext.name}</h1>
		{#if ext.description}
			<p class="text-base text-text-secondary">{ext.description}</p>
		{/if}

		<div class="flex flex-wrap gap-5 border-t border-border pt-3 text-sm text-text-secondary">
			<span
				><strong class="text-text">{formatNumber(ext.downloadCount ?? 0)}</strong> downloads</span
			>
			<span
				><strong class="text-text">{versions.length}</strong>
				{versions.length === 1 ? 'version' : 'versions'}</span
			>
			{#if latestVersion}
				<span
					>Last release <strong class="text-text">{timeAgo(latestVersion.publishedAt)}</strong
					></span
				>
			{/if}
		</div>
	</div>

	<!-- Tab bar -->
	<div class="mb-6 flex border-b border-border" bind:this={tabBarEl}>
		{#each tabs as tab}
			<button
				onclick={() => switchTab(tab.id)}
				class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors sm:gap-2 sm:px-5 sm:py-3 {activeTab ===
				tab.id
					? 'border-b-2 border-brand text-text'
					: 'text-text-secondary hover:text-text'}"
			>
				<tab.icon class="h-4 w-4" />
				<span class="hidden sm:inline">{tab.label}</span>
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	<div class="min-h-[600px]">
		{#if activeTab === 'overview'}
			<OverviewTab
				extension={ext}
				{versions}
				{latestVersion}
				{firstVersion}
				{githubSource}
				{maxDownloads}
				{readmeHtml}
				{providerRegistryBase}
			/>
		{:else if activeTab === 'versions'}
			<VersionsTab {versions} {latestVersion} {maxDownloads} extensionSlug={ext.slug} />
		{:else if activeTab === 'changelog'}
			<ChangelogTab {versions} {latestVersion} />
		{:else if activeTab === 'code'}
			<CodeTab {versions} {latestVersion} extensionSlug={ext.slug} />
		{/if}
	</div>
</div>
