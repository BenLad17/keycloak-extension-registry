<!-- Extension Detail Page -->
<script lang="ts">
	import type { KeycloakCompatibility } from '$lib/shared/types';

	interface VersionData {
		version: string;
		keycloakCompatibility: KeycloakCompatibility;
		deprecated: boolean | null;
		deprecationMessage: string | null;
		releaseNotes: string | null;
		jarUrl: string;
		jarSize: number | null;
		sha256: string;
		publishedAt: Date;
	}

	let { data } = $props();

	// Use derived for initial value to avoid state_referenced_locally warning
	const defaultVersion = $derived(data.versions[0]?.version ?? '');
	let selectedVersion = $state('');
	let copied = $state(false);

	// Initialize selectedVersion when data changes
	$effect(() => {
		if (!selectedVersion && defaultVersion) {
			selectedVersion = defaultVersion;
		}
	});

	const currentVersion = $derived(
		(data.versions as VersionData[]).find((v) => v.version === (selectedVersion || defaultVersion)) ?? (data.versions[0] as VersionData | undefined)
	);

	const manifestEntry = $derived(`extensions:
  - name: ${data.extension.slug}
    version: ${selectedVersion}`);

	function copyManifest() {
		navigator.clipboard.writeText(manifestEntry);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function formatDate(date: string | Date) {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.extension.name} - Keycloak Extension Registry</title>
	<meta name="description" content={data.extension.description} />
</svelte:head>

<!-- Header -->
<header class="mb-8 pb-8 border-b border-border">
	<div class="flex items-center gap-4 mb-4">
		<h1 class="text-3xl font-bold">{data.extension.name}</h1>
		<span class="text-sm px-3 py-1 bg-indigo-600 rounded">{data.extension.category}</span>
		{#if data.isPending}
			<span class="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 rounded">⏳ Pending Release</span>
		{/if}
	</div>

	{#if data.isPending}
		<div class="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mb-4">
			<p class="text-sm text-gray-400">
				<strong class="text-yellow-500">This extension is waiting for its first release.</strong>
				Once the owner publishes a GitHub release with a JAR file, it will become available for download.
			</p>
		</div>
	{/if}

	<p class="text-lg text-gray-400 mb-4">{data.extension.description}</p>

	<div class="flex flex-wrap gap-6 mb-4 text-sm text-gray-400">
		{#if data.owner}
			<span class="flex items-center gap-2">
				<img src={data.owner.avatarUrl} alt="" class="w-6 h-6 rounded-full" />
				{data.owner.username}
			</span>
		{/if}
		<span>📦 {data.extension.downloadCount?.toLocaleString() ?? 0} downloads</span>
		{#if data.extension.license}
			<span>📄 {data.extension.license}</span>
		{/if}
	</div>

	<div class="flex gap-3">
		<a href="https://github.com/{data.extension.githubRepo}" target="_blank" class="px-4 py-2 border border-border rounded-lg text-white no-underline hover:border-indigo-500 transition-colors">
			View on GitHub
		</a>
		{#if data.extension.homepage}
			<a href={data.extension.homepage} target="_blank" class="px-4 py-2 border border-border rounded-lg text-white no-underline hover:border-indigo-500 transition-colors">
				Homepage
			</a>
		{/if}
	</div>
</header>

<!-- Content Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
	{#if data.versions.length > 0}
		<!-- Installation Section -->
		<section>
			<h2 class="text-xl font-semibold mb-4">Installation</h2>

			<div class="flex items-center gap-3 mb-4">
				<label for="version" class="text-sm text-gray-400">Version:</label>
				<select id="version" bind:value={selectedVersion} class="px-3 py-2 border border-border rounded-lg bg-bg-secondary text-white">
					{#each data.versions as v}
						<option value={v.version}>
							{v.version}
							{#if v.deprecated}(deprecated){/if}
						</option>
					{/each}
				</select>
			</div>

			{#if currentVersion}
				<div class="p-4 bg-bg-secondary rounded-lg mb-4">
					<h3 class="text-sm font-medium mb-2">Keycloak Compatibility</h3>
					<p>{currentVersion.keycloakCompatibility.min} - {currentVersion.keycloakCompatibility.max}</p>
					{#if currentVersion.keycloakCompatibility.tested?.length}
						<p class="text-sm text-gray-400 mt-1">
							Tested: {currentVersion.keycloakCompatibility.tested.join(', ')}
						</p>
					{/if}
				</div>

				{#if currentVersion.deprecated}
					<div class="p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg mb-4 text-yellow-500">
						⚠️ This version is deprecated.
						{#if currentVersion.deprecationMessage}
							{currentVersion.deprecationMessage}
						{/if}
					</div>
				{/if}
			{/if}

			<div class="p-4 bg-bg-secondary rounded-lg mb-4">
				<h3 class="text-sm font-medium mb-3">Add to extensions.yaml</h3>
				<pre class="p-4 bg-bg rounded text-sm font-mono overflow-x-auto mb-3"><code>{manifestEntry}</code></pre>
				<button onclick={copyManifest} class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors cursor-pointer">
					{copied ? '✓ Copied!' : '📋 Copy'}
				</button>
			</div>

			{#if currentVersion}
				<div class="text-sm">
					<h3 class="font-medium mb-2">Direct Download</h3>
					<p class="mb-2">
						<a href={currentVersion.jarUrl} class="text-indigo-400 hover:underline">
							Download JAR ({((currentVersion.jarSize ?? 0) / 1024).toFixed(0)} KB)
						</a>
					</p>
					<p class="text-gray-500 break-all">
						SHA256: <code class="text-xs">{currentVersion.sha256}</code>
					</p>
				</div>
			{/if}
		</section>

		<!-- Versions Section -->
		<section>
			<h2 class="text-xl font-semibold mb-4">Versions</h2>

			<div class="flex flex-col gap-3">
				{#each data.versions as v}
					<div class="p-4 bg-bg-secondary border rounded-lg transition-colors {v.version === selectedVersion ? 'border-indigo-500' : 'border-border'}">
						<div class="flex justify-between items-center">
							<button onclick={() => (selectedVersion = v.version)} class="bg-transparent border-none text-white cursor-pointer p-0 flex items-center gap-2">
								<strong>{v.version}</strong>
								{#if v.deprecated}
									<span class="text-xs px-1.5 py-0.5 bg-yellow-700 rounded">deprecated</span>
								{/if}
							</button>
							<span class="text-xs text-gray-500">{formatDate(v.publishedAt)}</span>
						</div>
						{#if v.releaseNotes}
							<p class="mt-3 text-sm text-gray-400">{v.releaseNotes}</p>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{:else}
		<!-- No Versions -->
		<section class="col-span-full">
			<div class="text-center py-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
				<h2 class="text-xl font-semibold mb-4">📦 No Versions Available Yet</h2>
				<p class="text-gray-400 mb-2">
					This extension has been registered but no releases have been published yet.
				</p>
				<p class="text-gray-400">
					Check back later or watch the
					<a href="https://github.com/{data.extension.githubRepo}" target="_blank" class="text-indigo-400 hover:underline">GitHub repository</a>
					for updates.
				</p>
			</div>
		</section>
	{/if}
</div>
