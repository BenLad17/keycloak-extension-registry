<script lang="ts">
	import { ArrowRight, BookOpen } from 'lucide-svelte';
	import { formatNumber } from '$lib/utils/format';
	let { data } = $props();
</script>

<!-- Hero -->
<section class="mx-auto max-w-5xl pb-16 pt-20">
	<p class="mb-5 text-xs font-medium tracking-widest text-text-secondary uppercase">
		Community · Open Source
	</p>
	<h1 class="mb-5 max-w-2xl text-5xl font-semibold tracking-tight text-text" style="line-height: 1.1">
		Community extensions<br />for Keycloak.
	</h1>
	<p class="mb-8 max-w-xl text-base leading-relaxed text-text-secondary">
		Browse and install Keycloak extensions from the community. Nothing to install — extensions are
		pulled directly into your Docker build, no extra tools required.
	</p>

	<div class="flex items-center gap-3">
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
		<div class="mt-10 flex items-center gap-8">
			<div>
				<p class="text-2xl font-semibold tracking-tight text-text">{data.extensionCount}</p>
				<p class="text-xs text-text-secondary">Extensions</p>
			</div>
			{#if data.totalDownloads > 0}
				<div>
					<p class="text-2xl font-semibold tracking-tight text-text">{formatNumber(data.totalDownloads)}</p>
					<p class="text-xs text-text-secondary">Downloads</p>
				</div>
			{/if}
		</div>
	{/if}
</section>

<!-- How it works -->
<section class="mx-auto max-w-5xl pb-20">
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
		<div class="rounded-xl border border-border bg-surface p-6">
			<p class="card-title mb-2">No tooling</p>
			<p class="text-sm leading-relaxed text-text-secondary">
				Extensions are distributed as standard OCI images. If you can run <code class="rounded bg-surface-muted px-1 py-0.5 text-xs text-text">docker build</code>, you're set.
			</p>
		</div>
		<div class="rounded-xl border border-border bg-surface p-6">
			<p class="card-title mb-2">Pinned versions</p>
			<p class="text-sm leading-relaxed text-text-secondary">
				Every extension version gets its own immutable image tag, verified against its SHA-256 digest. Reproducible builds guaranteed.
			</p>
		</div>
		<div class="rounded-xl border border-border bg-surface p-6">
			<p class="card-title mb-2">No runtime dependency</p>
			<p class="text-sm leading-relaxed text-text-secondary">
				Extensions are baked into your image at build time. Your running container has no connection to this registry.
			</p>
		</div>
	</div>
</section>

<!-- Publish CTA -->
<section class="mx-auto max-w-5xl pb-20">
	<div class="rounded-xl border border-border bg-surface px-8 py-8">
		<div class="flex items-center justify-between gap-8">
			<div>
				<h2 class="mb-1 text-base font-semibold text-text">Building a Keycloak extension?</h2>
				<p class="text-sm text-text-secondary">
					Register it here so others can find and install it. Works with GitHub Releases and Maven Central.
				</p>
			</div>
			<a
				href="/publish"
				class="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-text-secondary no-underline transition-colors hover:border-border/60 hover:text-text"
			>
				Publish an extension
			</a>
		</div>
	</div>
</section>
