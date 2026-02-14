<!-- Publish/Register Extension Page -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';

	let { data, form } = $props();

	// Repo data - loaded async via API
	type Repo = { fullName: string; name: string; htmlUrl: string; isPrivate: boolean };
	let repos = $state<Repo[]>([]);
	let reposLoading = $state(true);
	let reposError = $state<string | null>(null);
	let needsInstallation = $state(false);

	let selectedRepo = $state('');
	let searchQuery = $state('');
	let isDropdownOpen = $state(false);
	let loading = $state(false);
	let validating = $state(false);
	let validationResult = $state<{ validated: boolean; error?: string; manifest?: { name: string; description: string } } | null>(null);

	// Load repos on mount
	onMount(() => {
		loadRepos();
	});

	async function loadRepos() {
		reposLoading = true;
		reposError = null;

		try {
			const res = await fetch('/api/repos');
			const json = await res.json() as { repos?: Repo[]; needsInstallation?: boolean; error?: string };

			repos = json.repos ?? [];
			needsInstallation = json.needsInstallation ?? false;
			reposError = json.error ?? null;
		} catch (e) {
			console.error('Error loading repos:', e);
			reposError = 'Failed to load repositories';
			needsInstallation = true;
		} finally {
			reposLoading = false;
		}
	}

	// Filter repos based on search query
	const filteredRepos = $derived(
		searchQuery.trim() === ''
			? repos
			: repos.filter(repo =>
				repo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				repo.name.toLowerCase().includes(searchQuery.toLowerCase())
			)
	);

	// Select a repo from dropdown
	function selectRepo(repo: Repo) {
		selectedRepo = repo.fullName;
		searchQuery = repo.fullName;
		isDropdownOpen = false;
	}

	// Validate repo when selected
	async function validateRepo() {
		if (!selectedRepo) {
			validationResult = null;
			return;
		}

		validating = true;
		validationResult = null;

		try {
			const res = await fetch('/api/repos/validate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ repo: selectedRepo })
			});

			validationResult = await res.json();
		} catch (e) {
			validationResult = { validated: false, error: 'Failed to validate repository' };
		} finally {
			validating = false;
		}
	}

	// Trigger validation when repo changes
	$effect(() => {
		if (selectedRepo) {
			validateRepo();
		} else {
			validationResult = null;
		}
	});

	// Get hint from form if available
	function getFormHint(): string | null {
		if (form && typeof form === 'object' && 'hint' in form) {
			return form.hint as string;
		}
		return null;
	}

	// Handle input focus
	function handleInputFocus() {
		isDropdownOpen = true;
	}

	// Handle click outside to close dropdown
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.repo-combobox')) {
			isDropdownOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<svelte:head>
	<title>Publish Extension - Keycloak Extension Registry</title>
</svelte:head>

<div class="max-w-3xl mx-auto">
	<h1 class="text-3xl font-bold mb-8">Register Extension</h1>

	{#if form?.success}
		<div class="p-6 bg-green-500/10 border border-green-500 rounded-xl text-center">
			<h2 class="text-xl font-semibold text-green-500 mb-4">✅ Extension Registered!</h2>

			{#if form.status === 'pending'}
				<div class="text-left bg-yellow-500/10 p-4 rounded-lg my-4">
					<p class="mb-3">
						<strong>{form.slug}</strong> has been registered and is waiting for its first release.
					</p>
					<p class="text-sm text-gray-400 mb-2">
						📦 Create a <a href="https://github.com/{selectedRepo}/releases/new" target="_blank" class="text-indigo-400 hover:underline">GitHub release</a> with a <code class="bg-black/30 px-1.5 py-0.5 rounded text-sm">.jar</code> file to publish your first version.
					</p>
					<p class="text-sm text-gray-400">
						🔄 Once you create a release, use "Sync" in your dashboard to import it, or wait for the webhook.
					</p>
				</div>
			{:else}
				<p>
					<strong>{form.slug}</strong> has been registered with {form.versions?.length ?? 0} version(s).
				</p>
			{/if}

			<div class="flex justify-center gap-4 mt-6">
				<a href="/extensions/{form.slug}" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">View Extension</a>
				<a href="/dashboard" class="px-4 py-2 border border-gray-600 hover:border-indigo-500 rounded-lg transition-colors">Go to Dashboard</a>
			</div>
		</div>
	{:else}
		<form
			method="POST"
			action="?/register"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<div class="space-y-6">
				<!-- Step 1: Manifest -->
				<section class="p-6 bg-bg-secondary border border-border rounded-xl">
					<h2 class="text-lg font-semibold mb-4">Step 1: Add manifest to your repo</h2>
					<p class="text-gray-400 mb-4">Create a <code class="bg-bg px-1.5 py-0.5 rounded text-sm">keycloak-extension.yaml</code> file in your repository root:</p>

					<pre class="p-4 bg-bg rounded-lg overflow-x-auto text-sm font-mono"><code>{`name: my-extension
description: My awesome Keycloak extension

build:
  type: github-release
  assetName: my-extension-{version}.jar

keycloakCompatibility:
  min: 24.0.0
  max: 27.0.0

categories:
  - Authentication

tags:
  - oauth
  - sso`}</code></pre>

					<a href="/docs/manifest" target="_blank" class="inline-block mt-4 text-indigo-400 hover:underline">
						📖 Full manifest documentation
					</a>
				</section>

				<!-- Step 2: Select Repo -->
				<section class="p-6 bg-bg-secondary border border-border rounded-xl">
					<h2 class="text-lg font-semibold mb-4">Step 2: Select your repository</h2>

					{#if data.justInstalled && needsInstallation}
						<div class="p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg mb-4 text-yellow-500">
							<p>
								<strong>Almost there!</strong> You installed the app, but didn't select any repositories.
								Click below to configure which repositories the app can access.
							</p>
						</div>
					{/if}

					{#if reposLoading}
						<!-- Loading State -->
						<div class="p-6 text-center">
							<div class="inline-block w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
							<p class="text-gray-400">Loading your repositories...</p>
						</div>
					{:else if needsInstallation}
						<div class="p-6 bg-indigo-500/10 border border-indigo-500 rounded-xl text-center">
							<h3 class="text-xl font-semibold mb-4">🔗 Connect Your Repositories</h3>
							<p class="text-gray-400 mb-6">
								To register extensions, grant this app access to your repositories.
								You'll be redirected to GitHub to select which repos to connect.
							</p>
							<a href={data.installUrl} class="inline-block px-6 py-3 text-gray-200 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-lg transition-colors">
								Connect GitHub Repositories →
							</a>
							<p class="text-sm text-gray-500 mt-4">
								You can choose specific repositories or grant access to all.
							</p>
						</div>
					{:else}
						<!-- Searchable Combobox -->
						<div class="repo-combobox relative">
							<input
								type="text"
								placeholder="Search and select a repository..."
								bind:value={searchQuery}
								onfocus={handleInputFocus}
								oninput={() => { isDropdownOpen = true; selectedRepo = ''; }}
								disabled={loading}
								class="w-full px-4 py-3 bg-bg border border-border rounded-lg focus:outline-none focus:border-indigo-500 transition-colors"
							/>

							<!-- Hidden input for form submission -->
							<input type="hidden" name="githubRepo" value={selectedRepo} />

							{#if isDropdownOpen && filteredRepos.length > 0}
								<div class="absolute z-10 w-full mt-1 max-h-64 overflow-y-auto bg-bg border border-border rounded-lg shadow-xl">
									{#each filteredRepos as repo}
										<button
											type="button"
											onclick={() => selectRepo(repo)}
											class="w-full px-4 py-3 text-left hover:bg-indigo-600/20 flex items-center justify-between transition-colors {selectedRepo === repo.fullName ? 'bg-indigo-600/30' : ''}"
										>
											<span class="truncate">{repo.fullName}</span>
											{#if repo.isPrivate}
												<span class="ml-2 text-xs text-gray-500">🔒</span>
											{/if}
										</button>
									{/each}
								</div>
							{/if}

							{#if isDropdownOpen && filteredRepos.length === 0 && searchQuery}
								<div class="absolute z-10 w-full mt-1 p-4 bg-bg border border-border rounded-lg text-gray-500 text-center">
									No repositories match "{searchQuery}"
								</div>
							{/if}
						</div>

						<p class="text-sm text-gray-500 mt-2">
							{repos.length} repositories available
							<button type="button" onclick={loadRepos} class="ml-2 text-indigo-400 hover:underline">↻ Refresh</button>
						</p>

						<!-- Validation result -->
						{#if validating}
							<div class="mt-4 p-4 bg-indigo-500/10 border border-indigo-500 rounded-lg text-indigo-400">
								⏳ Checking repository for manifest...
							</div>
						{:else if validationResult}
							{#if validationResult.validated}
								<div class="mt-4 p-4 bg-green-500/10 border border-green-500 rounded-lg">
									<strong class="text-green-500">✅ Ready to register!</strong>
									<p class="text-gray-400 mt-2">Found manifest: <strong class="text-white">{validationResult.manifest?.name}</strong></p>
									{#if validationResult.manifest?.description}
										<p class="text-gray-500 text-sm italic mt-1">{validationResult.manifest.description}</p>
									{/if}
								</div>
							{:else}
								<div class="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg">
									<strong class="text-red-500">❌ Cannot register</strong>
									<p class="text-gray-400 mt-2">{validationResult.error}</p>
									{#if validationResult.error?.includes('not found')}
										<p class="text-sm text-gray-500 mt-2">
											Add a <code class="bg-bg px-1.5 py-0.5 rounded text-xs">keycloak-extension.yaml</code> file to your repository root.
											<a href="/docs/manifest" target="_blank" class="text-indigo-400 hover:underline">See documentation →</a>
										</p>
									{/if}
								</div>
							{/if}
						{/if}

						{#if repos.length === 0 && !reposLoading}
							<p class="text-yellow-500 mt-4">
								No repositories found. Make sure you have installed the GitHub App on your repositories.
							</p>
						{/if}

						<p class="text-sm text-gray-500 mt-4">
							Don't see your repository? <a href={data.installUrl} class="text-indigo-400 hover:underline">Configure GitHub App access →</a>
						</p>
					{/if}
				</section>

				<!-- Step 3: Register -->
				<section class="p-6 bg-bg-secondary border border-border rounded-xl">
					<h2 class="text-lg font-semibold mb-4">Step 3: Register</h2>

					{#if form?.error}
						<div class="p-4 bg-red-500/10 border border-red-500 rounded-lg mb-4 text-red-400">
							<strong>Error:</strong> {form.error}
							{#if getFormHint()}
								<p class="mt-2 text-sm">
									💡 <a href={getFormHint()} target="_blank" class="text-indigo-400 hover:underline">Create a release →</a>
								</p>
							{/if}
						</div>
					{/if}

					<button
						type="submit"
						disabled={!selectedRepo || loading || validating || !validationResult?.validated}
						class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-lg transition-colors cursor-pointer"
					>
						{#if loading}
							Registering...
						{:else if validating}
							Validating...
						{:else}
							Register Extension
						{/if}
					</button>

					<div class="mt-4 text-sm text-gray-500">
						<p class="font-medium mb-2">Requirements:</p>
						<ul class="space-y-1">
							<li>✅ Repository must have a <code class="bg-bg px-1.5 py-0.5 rounded text-xs">keycloak-extension.yaml</code> manifest</li>
							<li>✅ At least one GitHub Release with a <code class="bg-bg px-1.5 py-0.5 rounded text-xs">.jar</code> file attached</li>
						</ul>
					</div>
				</section>
			</div>
		</form>
	{/if}
</div>
