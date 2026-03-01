<script lang="ts">
	import { enhance } from '$app/forms';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';

	let { data, form } = $props();

	const repos = $derived(data.repos ?? []);

	let repoSearch = $state('');
	let selectedFullName = $state('');
	let githubOwner = $state('');
	let githubRepo = $state('');

	const filteredRepos = $derived(
		repoSearch
			? repos.filter((r) =>
					`${r.owner}/${r.name}`.toLowerCase().includes(repoSearch.toLowerCase())
				)
			: repos
	);

	function selectRepo(owner: string, name: string) {
		githubOwner = owner;
		githubRepo = name;
		selectedFullName = `${owner}/${name}`;
		repoSearch = '';
	}

	let useGithubReleases = $state(true);
	let sameAsCodeSource = $state(true);
	let useMavenCentral = $state(false);
</script>

<div class="mx-auto max-w-2xl py-12">
	<h1 class="mb-2 text-3xl font-bold">Publish Extension</h1>
	<p class="mb-8 text-gray-400">Register a new Keycloak extension in the registry.</p>

	{#if form?.error}
		<div class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-6">
		<!-- Hidden owner/repo submitted with the form -->
		<input type="hidden" name="githubOwner" value={githubOwner} />
		<input type="hidden" name="githubRepo" value={githubRepo} />

		<!-- Basic info -->
		<div class="rounded-2xl border border-border bg-bg-secondary p-6">
			<h2 class="mb-4 text-lg font-semibold">Basic Info</h2>
			<label class="flex flex-col gap-1.5">
				<span class="text-sm text-gray-400">Category <span class="text-red-400">*</span></span>
				<select
					name="category"
					required
					class="cursor-pointer rounded-lg border border-border bg-bg-secondary/50 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
				>
					{#each Object.entries(ExtensionCategoryLabel) as [key, label]}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</label>
		</div>

		<!-- Code source repo picker -->
		<div class="rounded-2xl border border-border bg-bg-secondary p-6">
			<h2 class="mb-1 text-lg font-semibold">Code Source</h2>
			<p class="mb-4 text-sm text-gray-400">The GitHub repository where the source code lives.</p>

			{#if selectedFullName}
				<!-- Selected state -->
				<div class="flex items-center justify-between rounded-lg border border-indigo-500/40 bg-indigo-600/10 px-4 py-3">
					<span class="font-mono text-sm text-indigo-300">{selectedFullName}</span>
					<button
						type="button"
						onclick={() => { selectedFullName = ''; githubOwner = ''; githubRepo = ''; }}
						class="text-xs text-gray-500 hover:text-gray-300"
					>
						Change
					</button>
				</div>
			{:else}
				<!-- Picker -->
				{#if repos.length > 0}
					<div class="flex flex-col gap-2">
						{#if repos.length > 6}
							<input
								type="text"
								placeholder="Filter repositories…"
								bind:value={repoSearch}
								class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
							/>
						{/if}
						<div class="max-h-56 overflow-y-auto rounded-lg border border-border">
							{#each filteredRepos as repo}
								<button
									type="button"
									onclick={() => selectRepo(repo.owner, repo.name)}
									class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
								>
									<span class="font-mono text-sm text-white">{repo.owner}/{repo.name}</span>
									{#if repo.description}
										<span class="truncate text-xs text-gray-500">{repo.description}</span>
									{/if}
								</button>
							{:else}
								<p class="px-4 py-3 text-sm text-gray-600">No repositories match.</p>
							{/each}
						</div>
					</div>
				{:else}
					<p class="text-sm text-gray-500">No repositories with write access found.</p>
				{/if}
			{/if}
		</div>

		<!-- Artifact sources -->
		<div class="rounded-2xl border border-border bg-bg-secondary p-6">
			<h2 class="mb-1 text-lg font-semibold">Artifact Sources</h2>
			<p class="mb-5 text-sm text-gray-400">Where the compiled JARs are published. Select one or both.</p>

			<div class="flex flex-col gap-5">
				<!-- GitHub Releases -->
				<div class="flex flex-col gap-3">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							name="useGithubReleases"
							bind:checked={useGithubReleases}
							class="accent-indigo-500"
						/>
						<span class="font-medium">GitHub Releases</span>
					</label>

					{#if useGithubReleases}
						<div class="ml-6 flex flex-col gap-3">
							<label class="flex cursor-pointer items-center gap-2 text-sm text-gray-400">
								<input type="checkbox" bind:checked={sameAsCodeSource} class="accent-indigo-500" />
								Same repository as code source
							</label>

							{#if sameAsCodeSource}
								<input type="hidden" name="artifactOwner" value={githubOwner} />
								<input type="hidden" name="artifactRepo" value={githubRepo} />
							{:else}
								<div class="flex gap-3">
									<label class="flex flex-1 flex-col gap-1.5">
										<span class="text-sm text-gray-400">Owner <span class="text-red-400">*</span></span>
										<input
											type="text"
											name="artifactOwner"
											placeholder="acme-corp"
											class="rounded-lg border border-border bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
									</label>
									<label class="flex flex-1 flex-col gap-1.5">
										<span class="text-sm text-gray-400">Repo <span class="text-red-400">*</span></span>
										<input
											type="text"
											name="artifactRepo"
											placeholder="keycloak-my-extension"
											class="rounded-lg border border-border bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
										/>
									</label>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="border-t border-border"></div>

				<!-- Maven Central -->
				<div class="flex flex-col gap-3">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							name="useMavenCentral"
							bind:checked={useMavenCentral}
							class="accent-indigo-500"
						/>
						<span class="font-medium">Maven Central</span>
					</label>

					{#if useMavenCentral}
						<div class="ml-6 flex gap-3">
							<label class="flex flex-1 flex-col gap-1.5">
								<span class="text-sm text-gray-400">Group ID <span class="text-red-400">*</span></span>
								<input
									type="text"
									name="mavenGroupId"
									placeholder="com.example"
									class="rounded-lg border border-border bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
							</label>
							<label class="flex flex-1 flex-col gap-1.5">
								<span class="text-sm text-gray-400">Artifact ID <span class="text-red-400">*</span></span>
								<input
									type="text"
									name="mavenArtifactId"
									placeholder="keycloak-my-extension"
									class="rounded-lg border border-border bg-bg-secondary/50 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
								/>
							</label>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<button
			type="submit"
			disabled={!selectedFullName}
			class="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
		>
			Publish & Sync
		</button>
	</form>
</div>
