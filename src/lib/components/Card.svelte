<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Optional heading rendered with .card-title styling */
		title?: string;
		/** Inner padding. Use 'none' for divided/custom layouts */
		padding?: 'none' | 'sm' | 'md' | 'lg';
		/** Adds an indigo border tint — used for the "featured" card */
		highlight?: boolean;
		/** Extra classes forwarded to the root element */
		class?: string;
		children: Snippet;
	}

	let {
		title,
		padding = 'md',
		highlight = false,
		class: extraClass = '',
		children
	}: Props = $props();

	const padMap: Record<string, string> = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-8' };
</script>

<div class="card {padMap[padding]} {highlight ? 'border-indigo-500/30' : ''} {extraClass}">
	{#if title}
		<p class="card-title">{title}</p>
	{/if}
	{@render children()}
</div>
