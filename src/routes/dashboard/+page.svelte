<!-- Dashboard Page - User's extensions and settings -->
<script lang="ts">
	let { data } = $props();

	async function syncExtension(id: number) {
		// TODO: Implement manual sync trigger
		alert('Manual sync coming soon!');
	}
</script>

<svelte:head>
	<title>Dashboard - Keycloak Extension Registry</title>
</svelte:head>

<div class="container">
	<header class="page-header">
		<h1>My Extensions</h1>
		<a href="/publish" class="btn btn-primary">+ Register Extension</a>
	</header>

	{#if data.extensions.length === 0}
		<div class="empty-state">
			<h2>No extensions yet</h2>
			<p>You haven't registered any extensions yet.</p>
			<a href="/publish" class="btn btn-primary">Register your first extension</a>
		</div>
	{:else}
		<div class="extensions-list">
			{#each data.extensions as ext}
				<div class="extension-card">
					<div class="extension-info">
						<h3>
							<a href="/extensions/{ext.slug}">{ext.name}</a>
						</h3>
						<p>{ext.description}</p>
						<div class="meta">
							<span>📦 {ext.downloadCount?.toLocaleString() ?? 0} downloads</span>
							<span>🔗 {ext.githubRepo}</span>
							{#if ext.lastSyncedAt}
								<span>🔄 Last synced: {new Date(ext.lastSyncedAt).toLocaleDateString()}</span>
							{/if}
						</div>
					</div>

					<div class="extension-actions">
						{#if ext.lastSyncError}
							<span class="sync-error" title={ext.lastSyncError}>⚠️ Sync error</span>
						{/if}
						<a href="/extensions/{ext.slug}" class="btn">View</a>
						<button class="btn" onclick={() => syncExtension(ext.id)}>🔄 Sync</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>


<style>
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
		background: transparent;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.btn:hover {
		border-color: var(--color-primary, #6366f1);
	}

	.btn-primary {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border-radius: 0.75rem;
	}

	.empty-state h2 {
		margin-bottom: 0.5rem;
	}

	.empty-state p {
		color: var(--color-text-secondary, #a0a0c0);
		margin-bottom: 1.5rem;
	}

	.extensions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.extension-card {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		padding: 1.5rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.75rem;
	}

	.extension-info h3 {
		margin: 0 0 0.5rem;
	}

	.extension-info h3 a {
		color: inherit;
		text-decoration: none;
	}

	.extension-info h3 a:hover {
		color: var(--color-primary, #6366f1);
	}

	.extension-info p {
		color: var(--color-text-secondary, #a0a0c0);
		margin: 0 0 0.75rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.75rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.extension-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.sync-error {
		color: #ff6b6b;
		cursor: help;
	}
</style>
