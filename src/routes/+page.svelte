<script lang="ts">
    import {goto} from '$app/navigation';
    import {ExtensionCategoryLabel} from '$lib/common/extension-category';

    let {data} = $props();

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
            <svg
                    class="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
            >
                <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
            </svg>
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
            <span class="text-sm text-gray-500">{data.extensions.length}
                extension{data.extensions.length !== 1 ? 's' : ''}</span>
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
                    Be the first to <a href="/publish" class="text-indigo-400 hover:underline">publish an extension</a>!
                </p>
            {/if}
        </div>
    {:else}
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {#each data.extensions as ext}
                <a
                        href={`/extension/${ext.slug}`}
                        class="group block rounded-2xl border border-border bg-bg-secondary p-6 text-white no-underline transition-all duration-200 hover:border-indigo-500/50 hover:bg-bg-secondary/80"
                >
                    <div class="mb-3 flex items-start justify-between gap-3">
                        <h3 class="text-lg font-semibold transition-colors group-hover:text-indigo-400">
                            {ext.name}
                        </h3>
                        <span class="rounded-full bg-indigo-600/20 px-2.5 py-1 text-xs whitespace-nowrap text-indigo-400">{ExtensionCategoryLabel[ext.category]}</span>
                    </div>
                    <p class="mb-5 line-clamp-2 text-sm leading-relaxed text-gray-400">{ext.description}</p>
                    <div class="flex items-start justify-between gap-3 text-xs text-gray-500">
						<span class="flex items-center gap-1.5">
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="2"
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
							</svg>
                            {ext.downloadCount?.toLocaleString() ?? 0}
						</span>
                        <span class="flex items-center gap-1.5 truncate">
							<svg class="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
								<path
                                        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                                />
							</svg>
                            {ext.githubRepoOwner}/{ext.githubRepoName}
						</span>
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
