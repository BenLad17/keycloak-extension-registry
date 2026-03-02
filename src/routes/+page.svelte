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
		Browse, install, and publish Keycloak extensions from the community. Releases tracked from
		GitHub and Maven Central, versioned and reproducible.
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
	<div class="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1fr]">

		<!-- Fetcher install -->
		<div class="rounded-xl border border-border bg-surface p-7">
			<p class="card-title">Install via fetcher</p>
			<p class="mb-5 text-sm leading-relaxed text-text-secondary">
				Declare extensions in <code class="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text">providers.yaml</code>.
				The fetcher downloads and verifies JARs at Docker build time, no manual steps.
			</p>
			<pre class="overflow-x-auto rounded-lg border border-border bg-surface-muted px-5 py-4 text-[0.72rem] leading-loose"><span class="text-text-secondary/50"># providers.yaml</span>
<span class="text-text">providers:</span>
  - <span class="text-brand-fg">name</span>: <span class="text-success">keycloak-discord-idp</span>
    <span class="text-brand-fg">version</span>: <span class="text-success">2.1.0</span>
    <span class="text-brand-fg">sha256</span>: <span class="text-text-secondary/60">e3b0c44298fc1c14...</span>  <span class="text-text-secondary/30"># optional</span></pre>
			<a href="/docs" class="mt-4 inline-flex items-center gap-1 text-xs text-brand-fg hover:underline">
				Fetcher setup guide <ArrowRight class="h-3 w-3" />
			</a>
		</div>

		<!-- Manual install + sources -->
		<div class="flex flex-col gap-6">
			<div class="rounded-xl border border-border bg-surface p-7">
				<p class="card-title">Or install manually</p>
				<ol class="space-y-3 text-sm text-text-secondary">
					<li class="flex gap-3">
						<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-text-secondary">1</span>
						Download the JAR from the extension page
					</li>
					<li class="flex gap-3">
						<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-text-secondary">2</span>
						Copy it to <code class="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text">/opt/keycloak/providers/</code>
					</li>
					<li class="flex gap-3">
						<span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-text-secondary">3</span>
						Run <code class="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-text">kc.sh build</code> and restart
					</li>
				</ol>
			</div>

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
