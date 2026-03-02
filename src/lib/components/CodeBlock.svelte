<script lang="ts">
	import { Copy, Check } from 'lucide-svelte';
	import { highlight } from '$lib/hljs';

	let {
		code,
		lang,
		class: extraClass = ''
	}: {
		code: string;
		lang: string;
		class?: string;
	} = $props();

	const highlighted = $derived(highlight(code, lang));

	let copied = $state(false);

	async function copy() {
		await navigator.clipboard.writeText(code);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<div class="group relative {extraClass}">
	<pre
		class="hljs overflow-x-auto rounded-lg border border-border px-4 py-3 font-mono text-xs leading-relaxed"><code
		>{@html highlighted}</code
	></pre>
	<button
		onclick={copy}
		class="absolute top-2 right-2 flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text-secondary opacity-0 transition-all group-hover:opacity-100 hover:border-brand/50 hover:text-text"
	>
		{#if copied}
			<Check class="h-3 w-3 text-success" />
			<span class="text-success">Copied</span>
		{:else}
			<Copy class="h-3 w-3" />
			Copy
		{/if}
	</button>
</div>
