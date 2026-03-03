<script lang="ts">
	import { page } from '$app/state';

	let { children } = $props();

	const nav = [
		{ href: '/docs', label: 'Introduction' },
		{ href: '/docs/quickstart', label: 'Quick start' },
		{ href: '/docs/configuration', label: 'Dockerfile reference' },
		{ href: '/docs/faq', label: 'FAQ' }
	];
</script>

<div class="flex gap-12">
	<!-- Sidebar -->
	<nav class="hidden w-44 shrink-0 lg:block">
		<p class="mb-3 text-xs font-semibold tracking-widest text-text-secondary/60 uppercase">Documentation</p>
		<ul class="space-y-0.5">
			{#each nav as item}
				<li>
					<a
						href={item.href}
						class="block rounded-lg px-3 py-1.5 text-sm no-underline transition-colors {page.url
							.pathname === item.href
							? 'bg-brand/15 font-medium text-brand'
							: 'text-text-secondary hover:bg-surface-muted hover:text-text'}"
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Page content -->
	<div class="max-w-2xl min-w-0 flex-1">
		{@render children()}
	</div>
</div>
