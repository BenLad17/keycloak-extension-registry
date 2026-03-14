<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Badge from '$lib/components/Badge.svelte';
	import { Search, Download, ArrowUpDown } from 'lucide-svelte';
	import { formatNumber } from '$lib/utils/format';

	let { data } = $props();

	let searchQuery = $state(untrack(() => data.query));
	let selectedCategory = $state(untrack(() => data.category));
	let selectedSort = $state(untrack(() => data.sort));

	// Keep local state in sync when data changes (e.g. browser back/forward).
	$effect(() => {
		searchQuery = data.query;
	});
	$effect(() => {
		selectedCategory = data.category;
	});
	$effect(() => {
		selectedSort = data.sort;
	});

	function navigate() {
		goto(`/explore?q=${searchQuery}&category=${selectedCategory}&sort=${selectedSort}`);
	}
</script>

<svelte:head>
	<title>Explore Extensions - Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-5xl">
	<!-- Search bar -->
	<div class="mb-6 flex flex-col gap-2 pt-2 sm:flex-row">
		<div class="relative flex-1">
			<Search class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-secondary/40" />
			<input
				type="search"
				placeholder="Search extensions…"
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && navigate()}
				class="w-full rounded-lg border border-border bg-surface py-2.5 pr-4 pl-9 text-sm text-text placeholder-text-secondary/50 transition-colors focus:border-brand focus:ring-1 focus:ring-brand/20 focus:outline-none"
			/>
		</div>
		<select
			bind:value={selectedCategory}
			onchange={navigate}
			class="w-full cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text transition-colors focus:border-brand focus:ring-1 focus:ring-brand/20 focus:outline-none sm:w-auto"
		>
			<option value="">All categories</option>
			{#each Object.entries(ExtensionCategoryLabel) as [key, label]}
				<option value={key}>{label}</option>
			{/each}
		</select>
		<select
			bind:value={selectedSort}
			onchange={navigate}
			class="w-full cursor-pointer rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text transition-colors focus:border-brand focus:ring-1 focus:ring-brand/20 focus:outline-none sm:w-auto"
		>
			<option value="downloads">Most downloaded</option>
			<option value="updated">Recently updated</option>
			<option value="name">Name A–Z</option>
		</select>
		<a
			href={`/explore?q=${searchQuery}&category=${selectedCategory}&sort=${selectedSort}`}
			class="w-full rounded-lg bg-brand px-5 py-2.5 text-center text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85 sm:w-auto"
		>
			Search
		</a>
	</div>

	<!-- Results header -->
	<div class="mb-5 flex items-center justify-between">
		<p class="text-sm text-text-secondary">
			{#if data.query}
				Results for <span class="text-text">"{data.query}"</span>
			{:else if data.category}
				<span class="text-text"
					>{ExtensionCategoryLabel[data.category as keyof typeof ExtensionCategoryLabel]}</span
				>
			{:else}
				All extensions
			{/if}
		</p>
		{#if data.total > 0}
			<span class="text-xs text-text-secondary/60">
				{data.total}
				{data.total !== 1 ? 'extensions' : 'extension'}
			</span>
		{/if}
	</div>

	<!-- Grid -->
	{#if data.extensions.length === 0}
		<div class="rounded-xl border border-border bg-surface-muted py-16 text-center">
			<p class="mb-1 text-sm font-medium text-text-secondary">No extensions found</p>
			{#if data.query}
				<p class="text-sm text-text-secondary/60">Try a different search term or category</p>
			{:else}
				<p class="text-sm text-text-secondary/60">
					Be the first to <a href="/publish" class="text-brand hover:underline"
						>publish an extension</a
					>.
				</p>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each data.extensions as { extension: ext, githubOwner, githubRepo }}
				<a
					href={`/extension/${ext.slug}`}
					class="group flex flex-col rounded-xl border border-border bg-surface px-5 py-4 text-text no-underline transition-all hover:border-brand/30 hover:bg-surface-muted"
				>
					<div class="mb-2 flex items-start justify-between gap-3">
						<h3 class="text-sm leading-snug font-semibold transition-colors group-hover:text-brand">
							{ext.name}
						</h3>
						<Badge class="shrink-0">{ExtensionCategoryLabel[ext.category]}</Badge>
					</div>
					<p class="mb-4 line-clamp-2 grow text-sm leading-relaxed text-text-secondary">
						{ext.description}
					</p>
					<div class="flex items-center justify-between gap-3 text-xs text-text-secondary/60">
						<span class="flex shrink-0 items-center gap-1">
							<Download class="h-3.5 w-3.5" />
							{formatNumber(ext.downloadCount ?? 0)}
						</span>
						{#if githubOwner && githubRepo}
							<span class="min-w-0 truncate font-mono text-[0.7rem]"
								>{githubOwner}/{githubRepo}</span
							>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<div class="mt-8 flex justify-center gap-1.5">
				{#each Array(data.totalPages) as _, i}
					<a
						href={`/explore?page=${i + 1}&q=${data.query}&category=${data.category}&sort=${data.sort}`}
						class="flex h-8 w-8 items-center justify-center rounded-md text-xs text-text-secondary no-underline transition-colors hover:bg-surface-muted {data.page ===
						i + 1
							? 'bg-brand/10 font-medium text-brand'
							: ''}"
					>
						{i + 1}
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</div>
