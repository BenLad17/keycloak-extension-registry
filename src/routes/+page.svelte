<script lang="ts">
	import { ArrowRight, BookOpen, Compass, Package, ShieldCheck } from 'lucide-svelte';
	import { formatNumber } from '$lib/utils/format';
	let { data } = $props();
</script>

<!-- Hero -->
<section class="mx-auto max-w-5xl pb-10 pt-10 sm:pb-16 lg:pb-16 lg:pt-20">
	<span class="mb-6 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
		Community · Open Source
	</span>
	<h1 class="mb-5 max-w-2xl text-3xl font-semibold tracking-tight text-text sm:text-4xl lg:text-5xl" style="line-height: 1.1">
		Community extensions<br />for <span class="text-brand">Keycloak</span>.
	</h1>
	<p class="mb-8 max-w-xl text-base leading-relaxed text-text-secondary">
		A central index of community Keycloak extensions. Browse releases, download JARs directly, or
		pull them straight into your Docker build.
	</p>

	<div class="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
		<a
			href="/explore"
			class="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85"
		>
			Explore extensions
			<ArrowRight class="h-4 w-4" />
		</a>
		<a
			href="/docs"
			class="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary no-underline transition-colors hover:border-border/60 hover:text-text"
		>
			<BookOpen class="h-4 w-4" />
			Read the docs
		</a>
	</div>

	{#if data.extensionCount > 0}
		<div class="mt-10 flex items-center gap-6 border-t border-border pt-8 sm:gap-8">
			<div>
				<p class="text-2xl font-semibold tracking-tight text-text">{data.extensionCount}</p>
				<p class="text-xs text-text-secondary">Extensions</p>
			</div>
			{#if data.totalDownloads > 0}
				<div class="border-l border-border pl-6 sm:pl-8">
					<p class="text-2xl font-semibold tracking-tight text-text">{formatNumber(data.totalDownloads)}</p>
					<p class="text-xs text-text-secondary">Downloads</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<!-- Feature cards -->
<section class="mx-auto max-w-5xl pb-20">
	<div class="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3">
		<div class="rounded-xl border border-border bg-surface p-6">
			<div class="mb-2 flex items-start gap-2">
				<Compass class="mt-px h-4 w-4 shrink-0 text-brand" />
				<p class="card-title">One place to find extensions</p>
			</div>
			<p class="text-sm leading-relaxed text-text-secondary">
				Browse community extensions by category, see version history and changelogs, and find direct download links all in one place.
			</p>
		</div>
		<div class="rounded-xl border border-border bg-surface p-6">
			<div class="mb-2 flex items-start gap-2">
				<Package class="mt-px h-4 w-4 shrink-0 text-brand" />
				<p class="card-title">Install your way</p>
			</div>
			<p class="text-sm leading-relaxed text-text-secondary">
				Download JARs and drop them into your providers folder manually, or use the Docker integration to copy them straight into your image.
			</p>
		</div>
		<div class="rounded-xl border border-border bg-surface p-6">
			<div class="mb-2 flex items-start gap-2">
				<ShieldCheck class="mt-px h-4 w-4 shrink-0 text-brand" />
				<p class="card-title">Pinned versions</p>
			</div>
			<p class="text-sm leading-relaxed text-text-secondary">
				Every release is tracked with its SHA-256 digest, so you always know exactly what you're installing.
			</p>
		</div>
	</div>
</section>

<!-- Publish CTA -->
<section class="mx-auto max-w-5xl pb-20">
	<div class="rounded-xl border border-brand/20 bg-brand/5 px-5 py-5 sm:px-8 sm:py-8">
		<div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
			<div>
				<h2 class="mb-1 text-base font-semibold text-text">Building a Keycloak extension?</h2>
				<p class="text-sm text-text-secondary">
					Register it here so others can find and install it. Works with GitHub Releases and Maven Central.
				</p>
			</div>
			<a
				href="/publish"
				class="shrink-0 inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85"
			>
				Publish an extension
			</a>
		</div>
	</div>
</section>
