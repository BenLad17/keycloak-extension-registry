<script lang="ts">
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Badge from '$lib/components/Badge.svelte';
	import { Layers, Pencil, ExternalLink, AlertCircle, RefreshCw, Clock } from 'lucide-svelte';
	import { timeAgo } from '$lib/utils/format';

	let { data } = $props();
	const extensions = $derived(data.extensions);
</script>

<svelte:head>
	<title>My Extensions - Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-5xl py-10">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">My Extensions</h1>
			<p class="mt-1 text-sm text-text-secondary">Extensions you have published to the registry.</p>
		</div>
		<a
			href="/publish"
			class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/80"
		>
			Publish new
		</a>
	</div>

	{#if extensions.length === 0}
		<div
			class="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface-muted py-20 text-center"
		>
			<Layers class="h-10 w-10 text-text-secondary/40" />
			<p class="text-sm font-medium text-text-secondary">No extensions yet</p>
			<p class="text-xs text-text-secondary/60">Extensions you publish will appear here.</p>
			<a
				href="/publish"
				class="mt-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/80"
			>
				Publish your first extension
			</a>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each extensions as ext}
				<div
					class="rounded-xl border bg-surface px-5 py-4 transition-colors {ext.lastSyncError
						? 'border-danger/30'
						: 'border-border hover:border-border/80'}"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="min-w-0 flex-1">
							<div class="flex flex-wrap items-center gap-2">
								<a
									href="/extension/{ext.slug}"
									class="font-semibold text-text no-underline hover:text-brand"
								>
									{ext.name}
								</a>
								<Badge size="sm">{ExtensionCategoryLabel[ext.category]}</Badge>
								{#if ext.status === 'archived'}
									<Badge variant="muted" size="sm">Archived</Badge>
								{/if}
							</div>
							{#if ext.description}
								<p class="mt-1 truncate text-sm text-text-secondary">{ext.description}</p>
							{/if}
							<div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
								{#if ext.lastSyncError}
									<span class="flex items-center gap-1 text-danger">
										<AlertCircle class="h-3 w-3 shrink-0" />
										Sync error: {ext.lastSyncError}
									</span>
								{:else if ext.lastSyncedAt}
									<span class="flex items-center gap-1 text-text-secondary/60">
										<RefreshCw class="h-3 w-3 shrink-0" />
										Synced {timeAgo(ext.lastSyncedAt)}
									</span>
								{:else}
									<span class="flex items-center gap-1 text-text-secondary/60">
										<Clock class="h-3 w-3 shrink-0" />
										Pending first sync
									</span>
								{/if}
								{#if ext.githubOwner && ext.githubRepo}
									<span class="font-mono text-text-secondary/60">{ext.githubOwner}/{ext.githubRepo}</span>
								{/if}
							</div>
						</div>
						<div class="flex shrink-0 items-center gap-2">
							<a
								href="/extension/{ext.slug}"
								class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary no-underline transition-colors hover:border-border/60 hover:text-text"
							>
								<ExternalLink class="h-3.5 w-3.5" />
								View
							</a>
							<a
								href="/extension/{ext.slug}/edit"
								class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary no-underline transition-colors hover:border-brand/50 hover:text-text"
							>
								<Pencil class="h-3.5 w-3.5" />
								Edit
							</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
