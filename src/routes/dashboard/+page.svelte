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

<div class="flex justify-between items-center mb-8">
	<h1 class="text-3xl font-bold">My Extensions</h1>
	<a href="/publish" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white no-underline transition-colors">
		+ Register Extension
	</a>
</div>

{#if data.extensions.length === 0}
	<div class="text-center py-16 bg-bg-secondary rounded-xl">
		<h2 class="text-xl font-semibold mb-2">No extensions yet</h2>
		<p class="text-gray-400 mb-6">You haven't registered any extensions yet.</p>
		<a href="/publish" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white no-underline transition-colors">
			Register your first extension
		</a>
	</div>
{:else}
	<div class="flex flex-col gap-4">
		{#each data.extensions as ext}
			<div class="flex justify-between items-start gap-4 p-6 bg-bg-secondary border border-border rounded-xl">
				<div class="flex-1">
					<h3 class="text-lg font-semibold mb-2">
						<a href="/extensions/{ext.slug}" class="text-white no-underline hover:text-indigo-400 transition-colors">
							{ext.name}
						</a>
					</h3>
					<p class="text-gray-400 mb-3">{ext.description}</p>
					<div class="flex flex-wrap gap-4 text-xs text-gray-500">
						<span>📦 {ext.downloadCount?.toLocaleString() ?? 0} downloads</span>
						<span>🔗 {ext.githubRepo}</span>
						{#if ext.lastSyncedAt}
							<span>🔄 Last synced: {new Date(ext.lastSyncedAt).toLocaleDateString()}</span>
						{/if}
					</div>
				</div>

				<div class="flex items-center gap-2">
					{#if ext.lastSyncError}
						<span class="text-yellow-500" title={ext.lastSyncError}>⚠️ Sync error</span>
					{/if}
					<a href="/extensions/{ext.slug}" class="px-3 py-1.5 border border-border rounded-lg text-white no-underline hover:border-indigo-500 transition-colors">
						View
					</a>
					<button
						onclick={() => syncExtension(ext.id)}
						class="px-3 py-1.5 border border-border rounded-lg text-white hover:border-indigo-500 transition-colors cursor-pointer bg-transparent"
					>
						🔄 Sync
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
