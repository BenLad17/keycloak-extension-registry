<script lang="ts">
	import { goto } from '$app/navigation';
	import { EXTENSION_CATEGORIES } from '$lib/shared/types';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state('');
</script>

<div class="container">
	<section class="hero">
		<h1>Keycloak Extension Registry</h1>
		<p>Discover, install, and share extensions for Keycloak</p>

		<div class="search-box">
			<input
				type="search"
				placeholder="Search extensions..."
				bind:value={searchQuery}
				onkeydown={(e) => e.key === 'Enter' && goto(`/?q=${searchQuery}`)}
			/>
			<select bind:value={selectedCategory}>
				<option value="">All Categories</option>
				{#each EXTENSION_CATEGORIES as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
			<a href="/?q={searchQuery}&category={selectedCategory}" class="btn btn-primary">
				Search
			</a>
		</div>
	</section>

	<section class="extensions">
		<h2>
			{#if data.query}
				Search results for "{data.query}"
			{:else}
				Popular Extensions
			{/if}
		</h2>

		{#if data.extensions.length === 0}
			<div class="empty-state">
				<p>No extensions found</p>
				{#if data.query}
					<p>Try a different search term</p>
				{:else}
					<p>Be the first to <a href="/publish">publish an extension</a>!</p>
				{/if}
			</div>
		{:else}
			<div class="extension-grid">
				{#each data.extensions as ext}
					<a href="/extensions/{ext.slug}" class="extension-card">
						<div class="extension-header">
							<h3>{ext.name}</h3>
							<span class="category-badge">{ext.category}</span>
						</div>
						<p class="description">{ext.description}</p>
						<div class="extension-meta">
							<span class="downloads">📦 {ext.downloadCount?.toLocaleString() ?? 0}</span>
							<span class="repo">GitHub: {ext.githubRepo}</span>
						</div>
					</a>
				{/each}
			</div>

			{#if data.totalPages > 1}
				<div class="pagination">
					{#each Array(data.totalPages) as _, i}
						<a
							href="/?page={i + 1}&q={data.query}&category={data.category}"
							class="page-link"
							class:active={data.page === i + 1}
						>
							{i + 1}
						</a>
					{/each}
				</div>
			{/if}
		{/if}
	</section>
</div>

<style>
	.hero {
		text-align: center;
		padding: 3rem 0;
	}

	.hero h1 {
		font-size: 2.5rem;
		margin-bottom: 0.5rem;
	}

	.hero p {
		color: var(--color-text-secondary, #a0a0c0);
		font-size: 1.25rem;
		margin-bottom: 2rem;
	}

	.search-box {
		display: flex;
		gap: 0.5rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.search-box input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
		background: var(--color-bg-secondary, #1a1a2e);
		color: inherit;
		font-size: 1rem;
	}

	.search-box select {
		padding: 0.75rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
		background: var(--color-bg-secondary, #1a1a2e);
		color: inherit;
	}

	.extensions h2 {
		margin-bottom: 1.5rem;
	}

	.extension-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.extension-card {
		display: block;
		padding: 1.5rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.75rem;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.2s, transform 0.2s;
	}

	.extension-card:hover {
		border-color: var(--color-primary, #6366f1);
		transform: translateY(-2px);
	}

	.extension-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.extension-header h3 {
		font-size: 1.125rem;
		margin: 0;
	}

	.category-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		background: var(--color-primary, #6366f1);
		border-radius: 0.25rem;
		white-space: nowrap;
	}

	.description {
		color: var(--color-text-secondary, #a0a0c0);
		font-size: 0.875rem;
		margin-bottom: 1rem;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.extension-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.pagination {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 2rem;
	}

	.page-link {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.25rem;
		text-decoration: none;
		color: inherit;
	}

	.page-link.active {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
	}
</style>
