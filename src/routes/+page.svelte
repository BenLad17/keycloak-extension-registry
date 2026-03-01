<script lang="ts">
	import { goto } from '$app/navigation';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Badge from '$lib/components/Badge.svelte';
	import { Search, Download, Github } from 'lucide-svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('');
</script>

<!-- Hero Section -->
<section class="mb-12 py-16 text-center">
	<h1
		class="mb-4 bg-linear-to-r from-white to-gray-400 bg-clip-text pb-2 text-5xl leading-tight font-bold text-transparent"
	>
		Keycloak Extension Registry
	</h1>
	<p class="mx-auto mb-10 max-w-2xl text-xl text-gray-400">
		Discover, install, and share community-built extensions for Keycloak
	</p>

	<!-- Search Box -->
	<div class="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row">
		<div class="relative flex-1">
			<Search class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-500" />
			<input
				type="search"
				placeholder="Search extensions..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && goto(`/?q=${searchQuery}`)}
				class="w-full rounded-xl border border-border bg-bg-secondary py-3.5 pr-4 pl-12 text-white placeholder-gray-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
			/>
		</div>
		<select
			bind:value={selectedCategory}
			onchange={() => goto(`/?q=${searchQuery}&category=${selectedCategory}`)}
			class="cursor-pointer rounded-xl border border-border bg-bg-secondary px-4 py-3.5 text-white transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
		>
			<option value="">All Categories</option>
			{#each Object.entries(ExtensionCategoryLabel) as [key, label]}
				<option value={key}>{label}</option>
			{/each}
		</select>
		<a
			href={`/?q=${searchQuery}&category=${selectedCategory}`}
			class="rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white no-underline shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/30"
		>
			Search
		</a>
	</div>
</section>

<!-- Extensions Section -->
<section>
	<div class="mb-8 flex items-center justify-between">
		<h2 class="text-2xl font-semibold">
			{#if data.query}
				Results for "{data.query}"
			{:else}
				Popular Extensions
			{/if}
		</h2>
		{#if data.extensions.length > 0}
			<span class="text-sm text-gray-500"
				>{data.extensions.length}
				extension{data.extensions.length !== 1 ? 's' : ''}</span
			>
		{/if}
	</div>

	{#if data.extensions.length === 0}
		<div class="rounded-2xl border border-border bg-bg-secondary/50 py-20 text-center">
			<div class="mb-4 text-6xl">📦</div>
			<p class="mb-2 text-xl text-gray-400">No extensions found</p>
			{#if data.query}
				<p class="text-gray-500">Try a different search term</p>
			{:else}
				<p class="text-gray-500">
					Be the first to <a href="/publish" class="text-indigo-400 hover:underline"
						>publish an extension</a
					>!
				</p>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
			{#each data.extensions as { extension: ext, githubOwner, githubRepo }}
				<a
					href={`/extension/${ext.slug}`}
					class="group block rounded-2xl border border-border bg-bg-secondary p-6 text-white no-underline transition-all duration-200 hover:border-indigo-500/50 hover:bg-bg-secondary/80"
				>
					<div class="mb-3 flex items-start justify-between gap-3">
						<h3 class="text-lg font-semibold transition-colors group-hover:text-indigo-400">
							{ext.name}
						</h3>
						<Badge class="whitespace-nowrap">{ExtensionCategoryLabel[ext.category]}</Badge>
					</div>
					<p class="mb-5 line-clamp-2 text-sm leading-relaxed text-gray-400">{ext.description}</p>
					<div class="flex items-start justify-between gap-3 text-xs text-gray-500">
						<span class="flex items-center gap-1.5">
							<Download class="h-4 w-4" />
							{ext.downloadCount?.toLocaleString() ?? 0}
						</span>
						{#if githubOwner && githubRepo}
							<span class="flex items-center gap-1.5 truncate">
								<Github class="h-4 w-4 shrink-0" />
								{githubOwner}/{githubRepo}
							</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<div class="mt-10 flex justify-center gap-2">
				{#each Array(data.totalPages) as _, i}
					<a
						href={`/?page=${i + 1}&q=${data.query}&category=${data.category}`}
						class="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-white no-underline transition-all hover:border-indigo-500 {data.page ===
						i + 1
							? 'border-indigo-600 bg-indigo-600'
							: ''}"
					>
						{i + 1}
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</section>
