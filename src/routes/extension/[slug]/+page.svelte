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
	import { marked } from 'marked';
	import { emojify } from 'node-emoji';
	import { timeAgo } from '$lib/utils/format';
	import { page } from '$app/state';
	import OverviewTab from './tabs/OverviewTab.svelte';
	import VersionsTab from './tabs/VersionsTab.svelte';
	import ChangelogTab from './tabs/ChangelogTab.svelte';
	import CodeTab from './tabs/CodeTab.svelte';

	let { data } = $props();

	const ext = $derived(data.extension);
	const versions = $derived(data.versions);
	const githubSource = $derived(data.githubSource);
	const canManage = $derived(data.canManage);
	const latestVersion = $derived(versions[0] ?? null);
	const justPublished = $derived(page.url.searchParams.get('published') === 'true');
	const firstVersion = $derived(versions[versions.length - 1] ?? null);
	const maxDownloads = $derived(Math.max(...versions.map((v) => v.downloadCount ?? 0), 1));
	const readmeHtml = $derived(ext.readme ? String(marked(emojify(ext.readme))) : null);

	let activeTab = $state<'overview' | 'versions' | 'changelog' | 'code'>('overview');

	const tabs = [
		{ id: 'overview', label: 'Overview', icon: BookOpen },
		{ id: 'versions', label: 'Versions', icon: History },
		{ id: 'changelog', label: 'Changelog', icon: ScrollText },
		{ id: 'code', label: 'Code', icon: FileCode2 }
	] as const;
</script>

<svelte:head>
	<title>{ext.name} – Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-10">
	<!-- Top bar: back link + repo link -->
	<div class="mb-6 flex items-center justify-between gap-3">
		<a
			href="/"
			class="inline-flex items-center gap-1.5 text-sm text-gray-500 no-underline transition-colors hover:text-gray-300"
		>
			<ArrowLeft class="h-4 w-4" />
			Browse extensions
		</a>
		{#if githubSource}
			<a
				href="https://github.com/{githubSource.owner}/{githubSource.repo}"
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-1.5 text-sm text-gray-500 no-underline hover:text-gray-300"
			>
				<Github class="h-4 w-4" />
				{githubSource.owner}/{githubSource.repo}
			</a>
		{/if}
	</div>

	<!-- Published banner -->
	{#if justPublished}
		<div
			class="mb-6 flex items-center gap-3 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-400"
		>
			<CheckCircle class="h-4 w-4 shrink-0" />
			Extension published successfully. Versions will sync in the background.
		</div>
	{/if}

	<!-- Archived banner -->
	{#if ext.status === 'archived'}
		<div
			class="mb-6 flex items-center gap-3 rounded-xl border border-yellow-600/30 bg-yellow-600/10 px-4 py-3 text-sm text-yellow-400"
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
					class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-gray-400 no-underline transition-colors hover:border-indigo-500/50 hover:text-white"
				>
					<Pencil class="h-3.5 w-3.5" />
					Edit
				</a>
			{/if}
		</div>

		<h1 class="text-3xl font-bold tracking-tight">{ext.name}</h1>
		{#if ext.description}
			<p class="text-base text-gray-400">{ext.description}</p>
		{/if}

		<div class="flex flex-wrap gap-5 border-t border-border pt-3 text-sm text-gray-500">
			<span
				><strong class="text-white">{(ext.downloadCount ?? 0).toLocaleString()}</strong> downloads</span
			>
			<span
				><strong class="text-white">{versions.length}</strong>
				{versions.length === 1 ? 'version' : 'versions'}</span
			>
			{#if latestVersion}
				<span
					>Last release <strong class="text-white">{timeAgo(latestVersion.publishedAt)}</strong
					></span
				>
			{/if}
		</div>
	</div>

	<!-- Tab bar -->
	<div class="mb-6 flex border-b border-border">
		{#each tabs as tab}
			<button
				onclick={() => (activeTab = tab.id)}
				class="flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors {activeTab ===
				tab.id
					? 'border-b-2 border-indigo-500 text-white'
					: 'text-gray-500 hover:text-gray-300'}"
			>
				<tab.icon class="h-4 w-4" />
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Tab content -->
	{#if activeTab === 'overview'}
		<OverviewTab
			extension={ext}
			{versions}
			{latestVersion}
			{firstVersion}
			{githubSource}
			{maxDownloads}
			{readmeHtml}
		/>
	{:else if activeTab === 'versions'}
		<VersionsTab {versions} {latestVersion} {maxDownloads} />
	{:else if activeTab === 'changelog'}
		<ChangelogTab {versions} {latestVersion} />
	{:else if activeTab === 'code'}
		<CodeTab {versions} {latestVersion} extensionSlug={ext.slug} />
	{/if}
</div>
