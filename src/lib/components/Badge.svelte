<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'danger' | 'muted';
		/** sm — compact (lists, cards)  md — prominent (headings) */
		size?: 'sm' | 'md';
		class?: string;
		children: Snippet;
	}

	let { variant = 'primary', size = 'sm', class: extraClass = '', children }: Props = $props();

	const variantCls = $derived({
		primary: 'badge-primary',
		danger: 'badge-danger',
		muted: 'badge-muted'
	}[variant]);

	const sizeCls = $derived({
		sm: 'px-2.5 py-1 text-xs',
		md: 'px-3 py-1 text-sm'
	}[size]);
</script>

<span class="badge {variantCls} {sizeCls} {extraClass}">
	{@render children()}
</span>
