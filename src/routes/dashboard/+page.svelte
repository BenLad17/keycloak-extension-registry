<script lang="ts">
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import Badge from '$lib/components/Badge.svelte';
	import { Layers, Pencil, ExternalLink } from 'lucide-svelte';

	let { data } = $props();
	const extensions = $derived(data.extensions);
</script>

<svelte:head>
	<title>My Extensions – Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-5xl py-10">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight">My Extensions</h1>
			<p class="mt-1 text-sm text-gray-500">Extensions you have published to the registry.</p>
		</div>
		<a
			href="/publish"
			class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-indigo-500"
		>
			Publish new
		</a>
	</div>

	{#if extensions.length === 0}
		<div
			class="flex flex-col items-center gap-4 rounded-2xl border border-border bg-bg-secondary/50 py-20 text-center"
		>
			<Layers class="h-10 w-10 text-gray-700" />
			<p class="text-sm font-medium text-gray-400">No extensions yet</p>
			<p class="text-xs text-gray-600">Extensions you publish will appear here.</p>
			<a
				href="/publish"
				class="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline transition-colors hover:bg-indigo-500"
			>
				Publish your first extension
			</a>
		</div>
	{:else}
		<div class="flex flex-col gap-3">
			{#each extensions as ext}
				<div
					class="flex items-center justify-between gap-4 rounded-2xl border border-border bg-bg-secondary px-5 py-4 transition-colors hover:border-border/80"
				>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<a
								href="/extension/{ext.slug}"
								class="font-semibold text-white no-underline hover:text-indigo-400"
							>
								{ext.name}
							</a>
							<Badge size="sm">{ExtensionCategoryLabel[ext.category]}</Badge>
							{#if ext.status === 'archived'}
								<Badge variant="muted" size="sm">Archived</Badge>
							{/if}
						</div>
						{#if ext.description}
							<p class="mt-1 truncate text-sm text-gray-500">{ext.description}</p>
						{/if}
						<p class="mt-1 text-xs text-gray-600">
							{(ext.downloadCount ?? 0).toLocaleString()} downloads
							{#if ext.githubOwner && ext.githubRepo}
								· <span class="font-mono">{ext.githubOwner}/{ext.githubRepo}</span>
							{/if}
						</p>
					</div>
					<div class="flex shrink-0 items-center gap-2">
						<a
							href="/extension/{ext.slug}"
							class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-gray-400 no-underline transition-colors hover:border-border/60 hover:text-white"
						>
							<ExternalLink class="h-3.5 w-3.5" />
							View
						</a>
						<a
							href="/extension/{ext.slug}/edit"
							class="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-gray-400 no-underline transition-colors hover:border-indigo-500/50 hover:text-white"
						>
							<Pencil class="h-3.5 w-3.5" />
							Edit
						</a>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
