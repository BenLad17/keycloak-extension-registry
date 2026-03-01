<script lang="ts">
	import { slide } from 'svelte/transition';
	import { Download, Tag, Calendar, Package, ChevronDown, Copy, Check, Hash } from 'lucide-svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { formatCount, formatSize, formatDate, renderNotes } from '$lib/utils/format';
	import type { ExtensionVersion } from '$lib/server/db';

	let {
		versions,
		latestVersion,
		maxDownloads
	}: {
		versions: ExtensionVersion[];
		latestVersion: ExtensionVersion | null;
		maxDownloads: number;
	} = $props();

	const initialExpandedId = $derived(versions[0]?.releaseNotes ? versions[0].id : null);
	let expandedNotesId = $state<number | null>(null);
	$effect(() => { expandedNotesId = initialExpandedId; });
	let digestCopied = $state(false);

	async function copyDigest(digest: string) {
		await navigator.clipboard.writeText(digest);
		digestCopied = true;
		setTimeout(() => (digestCopied = false), 2000);
	}
</script>

{#if versions.length === 0}
	<div class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-secondary/50 py-20 text-center">
		<Package class="h-10 w-10 text-gray-700" />
		<p class="text-sm font-medium text-gray-400">No versions yet</p>
		<p class="text-xs text-gray-600">Releases will appear here once this extension is synced.</p>
	</div>
{:else}
	<div class="space-y-3">
		{#each versions as v}
			{@const isLatest = v.id === latestVersion?.id}
			{@const isExpanded = expandedNotesId === v.id}
			<div
				class="overflow-hidden rounded-2xl border bg-bg-secondary transition-colors duration-150 {isLatest ? 'border-indigo-500/30' : 'border-border'}"
			>
				<!-- Header row -->
				<div
					class="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5 {v.releaseNotes ? 'cursor-pointer select-none' : ''}"
					onclick={() => v.releaseNotes && (expandedNotesId = isExpanded ? null : v.id)}
					role={v.releaseNotes ? 'button' : undefined}
				>
					<!-- Version + date -->
					<div class="w-64 shrink-0 space-y-1.5">
						<div class="flex flex-wrap items-center gap-2">
							<Tag class="h-3.5 w-3.5 shrink-0 text-gray-600" />
							<span class="font-mono text-sm font-semibold text-white">{v.version}</span>
							{#if isLatest}<Badge>latest</Badge>{/if}
							{#if v.deprecated}<Badge variant="danger">deprecated</Badge>{/if}
							{#if v.keycloakVersion}<Badge variant="muted">KC {v.keycloakVersion}</Badge>{/if}
						</div>
						<div class="flex items-center gap-1.5 text-xs text-gray-600">
							<Calendar class="h-3 w-3 shrink-0" />
							{formatDate(v.publishedAt)}
						</div>
					</div>

					<!-- Download bar + count -->
					<div class="flex shrink-0 items-center gap-2">
						<div class="h-1 w-24 overflow-hidden rounded-full bg-bg">
							<div
								class="h-1 rounded-full bg-indigo-400/30 transition-all"
								style="width: {maxDownloads > 0 ? (((v.downloadCount ?? 0) / maxDownloads) * 100).toFixed(1) : 0}%"
							></div>
						</div>
						<div class="flex w-16 shrink-0 items-center justify-end gap-1 text-xs tabular-nums text-gray-600">
							<Download class="h-3 w-3 shrink-0" />
							{formatCount(v.downloadCount ?? 0)}
						</div>
					</div>

					<!-- Size + download button + chevron -->
					<div class="ml-auto flex shrink-0 items-center gap-3">
						<div class="flex items-center gap-1.5 text-xs text-gray-600">
							<Package class="h-3.5 w-3.5" />
							{formatSize(v.downloadSize)}
						</div>
						<a
							href={v.downloadUrl}
							download
							onclick={(e) => e.stopPropagation()}
							class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm no-underline transition-colors {isLatest ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'border border-border text-gray-400 hover:border-indigo-500/50 hover:text-white'}"
						>
							<Download class="h-3.5 w-3.5" />
							Download
						</a>
						{#if v.releaseNotes}
							<ChevronDown class="h-4 w-4 shrink-0 text-gray-600 transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}" />
						{/if}
					</div>
				</div>

				<!-- Release notes -->
				{#if isExpanded && v.releaseNotes}
					<div transition:slide={{ duration: 220 }} class="border-t border-border bg-bg/50 px-6 py-5">
						<div class="prose prose-invert prose-sm max-w-none">
							{@html renderNotes(v.releaseNotes)}
						</div>
						<div class="mt-4 flex items-center gap-2 border-t border-border pt-4">
							<Hash class="h-3.5 w-3.5 shrink-0 text-gray-600" />
							<span class="flex-1 truncate font-mono text-xs text-gray-600" title={v.digest}>
								SHA-256: {v.digest}
							</span>
							<button
								onclick={() => copyDigest(v.digest)}
								class="shrink-0 text-gray-600 transition-colors hover:text-gray-300"
								title="Copy digest"
							>
								{#if digestCopied}
									<Check class="h-3.5 w-3.5 text-green-400" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
							</button>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}
