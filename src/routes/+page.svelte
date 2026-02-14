<script lang="ts">
	import { goto } from '$app/navigation';
	import { EXTENSION_CATEGORIES } from '$lib/shared/types';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('');
</script>

<!-- Hero Section -->
<section class="text-center py-16 mb-12">
	<h1 class="text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight">
		Keycloak Extension Registry
	</h1>
	<p class="text-gray-400 text-xl mb-10 max-w-2xl mx-auto">
		Discover, install, and share community-built extensions for Keycloak
	</p>

	<!-- Search Box -->
	<div class="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
		<div class="flex-1 relative">
			<svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
			</svg>
			<input
				type="search"
				placeholder="Search extensions..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && goto(`/?q=${searchQuery}`)}
				class="w-full pl-12 pr-4 py-3.5 border border-border rounded-xl bg-bg-secondary text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
			/>
		</div>
		<select
			bind:value={selectedCategory}
			class="px-4 py-3.5 border border-border rounded-xl bg-bg-secondary text-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
		>
			<option value="">All Categories</option>
			{#each EXTENSION_CATEGORIES as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
		<a
			href="/?q={searchQuery}&category={selectedCategory}"
			class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white no-underline font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5"
		>
			Search
		</a>
	</div>
</section>

<!-- Extensions Section -->
<section>
	<div class="flex items-center justify-between mb-8">
		<h2 class="text-2xl font-semibold">
			{#if data.query}
				Results for "{data.query}"
			{:else}
				Popular Extensions
			{/if}
		</h2>
		{#if data.extensions.length > 0}
			<span class="text-sm text-gray-500">{data.extensions.length} extension{data.extensions.length !== 1 ? 's' : ''}</span>
		{/if}
	</div>

	{#if data.extensions.length === 0}
		<div class="text-center py-20 bg-bg-secondary/50 rounded-2xl border border-border">
			<div class="text-6xl mb-4">📦</div>
			<p class="text-xl text-gray-400 mb-2">No extensions found</p>
			{#if data.query}
				<p class="text-gray-500">Try a different search term</p>
			{:else}
				<p class="text-gray-500">Be the first to <a href="/publish" class="text-indigo-400 hover:underline">publish an extension</a>!</p>
			{/if}
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
			{#each data.extensions as ext}
				<a
					href="/extensions/{ext.slug}"
					class="group block p-6 bg-bg-secondary border border-border rounded-2xl no-underline text-white hover:border-indigo-500/50 hover:bg-bg-secondary/80 transition-all duration-200"
				>
					<div class="flex items-start justify-between gap-3 mb-3">
						<h3 class="text-lg font-semibold group-hover:text-indigo-400 transition-colors">{ext.name}</h3>
						<span class="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-400 rounded-full whitespace-nowrap">{ext.category}</span>
					</div>
					<p class="text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed">{ext.description}</p>
					<div class="flex items-center gap-4 text-xs text-gray-500">
						<span class="flex items-center gap-1.5">
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
							</svg>
							{ext.downloadCount?.toLocaleString() ?? 0}
						</span>
						<span class="truncate flex items-center gap-1.5">
							<svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
							</svg>
							{ext.githubRepo}
						</span>
					</div>
				</a>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<div class="flex justify-center gap-2 mt-10">
				{#each Array(data.totalPages) as _, i}
					<a
						href="/?page={i + 1}&q={data.query}&category={data.category}"
						class="w-10 h-10 flex items-center justify-center border border-border rounded-lg no-underline text-white hover:border-indigo-500 transition-all {data.page === i + 1 ? 'bg-indigo-600 border-indigo-600' : ''}"
					>
						{i + 1}
					</a>
				{/each}
			</div>
		{/if}
	{/if}
</section>
