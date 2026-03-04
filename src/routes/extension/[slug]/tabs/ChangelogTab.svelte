<script lang="ts">
	import { Calendar, History } from 'lucide-svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { formatDate, renderNotes } from '$lib/utils/format';
	import type { ExtensionVersion } from '$lib/server/db';

	let {
		versions,
		latestVersion
	}: {
		versions: ExtensionVersion[];
		latestVersion: ExtensionVersion | null;
	} = $props();
</script>

{#if versions.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-muted py-20 text-center"
	>
		<History class="h-10 w-10 text-text-secondary/40" />
		<p class="text-sm font-medium text-text-secondary">No changelog entries</p>
		<p class="text-xs text-text-secondary/60">Release notes will appear here once versions are synced.</p>
	</div>
{:else}
	<div>
		{#each versions as v, i}
			{@const isLatest = v.id === latestVersion?.id}
			<div class="relative flex gap-4 sm:gap-6 {i < versions.length - 1 ? 'pb-6 sm:pb-8' : ''}">
				<!-- Timeline dot + line -->
				<div class="flex flex-col items-center">
					<div
						class="z-10 mt-1 h-3 w-3 shrink-0 rounded-full border-2 {isLatest
							? 'border-brand bg-brand/40'
							: 'border-border bg-bg'}"
					></div>
					{#if i < versions.length - 1}
						<div class="mt-1 w-px flex-1 bg-border"></div>
					{/if}
				</div>

				<!-- Entry -->
				<div class="min-w-0 flex-1 pb-2">
					<div class="mb-3 flex flex-wrap items-center gap-2">
						<span class="font-mono text-sm font-semibold text-text">{v.version}</span>
						{#if isLatest}<Badge>latest</Badge>{/if}
						{#if v.deprecated}<Badge variant="danger">deprecated</Badge>{/if}
						{#if v.keycloakVersion}<Badge variant="muted">KC {v.keycloakVersion}</Badge>{/if}
						<span class="flex items-center gap-1 text-xs text-text-secondary/60">
							<Calendar class="h-3 w-3" />
							{formatDate(v.publishedAt)}
						</span>
					</div>
					{#if v.releaseNotes}
						<div
							class="prose prose-sm max-w-none rounded-xl border border-border bg-surface px-5 py-4"
						>
							{@html renderNotes(v.releaseNotes)}
						</div>
					{:else}
						<p class="text-xs text-text-secondary/60 italic">No release notes for this version.</p>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
