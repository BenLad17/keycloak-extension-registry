<script lang="ts">
	import { page } from '$app/state';
	import { ArrowLeft } from 'lucide-svelte';
</script>

<svelte:head>
	<title>{page.status} - Keycloak Extension Registry</title>
</svelte:head>

<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
	<p class="mb-3 font-mono text-5xl font-semibold text-text/20">{page.status}</p>
	<h1 class="mb-2 text-xl font-semibold text-text">
		{#if page.status === 404}
			Page not found
		{:else if page.status === 403}
			Access denied
		{:else}
			Something went wrong
		{/if}
	</h1>
	<p class="mb-8 max-w-sm text-sm text-text-secondary">
		{#if page.status === 404}
			The page you're looking for doesn't exist or may have been moved.
		{:else if page.status === 403}
			You don't have permission to access this page.
		{:else}
			An unexpected error occurred. Try refreshing, or come back later.
		{/if}
	</p>
	<a
		href="/explore"
		class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary no-underline transition-colors hover:border-border/60 hover:text-text"
	>
		<ArrowLeft class="h-4 w-4" />
		Browse extensions
	</a>
</div>
