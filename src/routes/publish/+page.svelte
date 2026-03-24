<script lang="ts">
	import { enhance } from '$app/forms';
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';

	let { data, form } = $props();

	let repoSearch = $state('');
	let selectedFullName = $state('');
	let githubOwner = $state('');
	let githubRepo = $state('');

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

<div class="mx-auto max-w-2xl py-6 sm:py-12">
	<h1 class="mb-2 text-2xl font-semibold">Publish Extension</h1>
	<p class="mb-8 text-text-secondary">Register a new Keycloak extension in the registry.</p>

	{#if form?.error}
		<div class="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
			{form.error}
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-6">
		<!-- Hidden owner/repo submitted with the form -->
		<input type="hidden" name="githubOwner" value={githubOwner} />
		<input type="hidden" name="githubRepo" value={githubRepo} />

		<!-- Basic info -->
		<div class="rounded-xl border border-border bg-surface p-4 sm:p-6">
			<h2 class="card-title">Basic Info</h2>
			<label class="flex flex-col gap-1.5">
				<span class="text-sm text-text-secondary">Category <span class="text-danger">*</span></span>
				<select
					name="category"
					required
					class="cursor-pointer rounded-lg border border-border bg-surface-muted px-4 py-2 text-text focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
				>
					{#each Object.entries(ExtensionCategoryLabel) as [key, label]}
						<option value={key}>{label}</option>
					{/each}
				</select>
			</label>
		</div>

		<!-- Code source repo picker -->
		<div class="rounded-xl border border-border bg-surface p-4 sm:p-6">
			<h2 class="mb-1 text-sm font-semibold text-text">Code Source</h2>
			<p class="mb-4 text-sm text-text-secondary">
				The GitHub repository where the source code lives.
			</p>

			{#if selectedFullName}
				<!-- Selected state -->
				<div
					class="flex items-center justify-between rounded-lg border border-brand/40 bg-brand/10 px-4 py-3"
				>
					<span class="font-mono text-sm text-brand">{selectedFullName}</span>
					<button
						type="button"
						onclick={() => {
							selectedFullName = '';
							githubOwner = '';
							githubRepo = '';
						}}
						class="text-xs text-text-secondary hover:text-text"
					>
						Change
					</button>
				</div>
			{:else}
				{#await data.repos}
					<div class="flex items-center gap-2 text-sm text-text-secondary">
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							/>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
							/>
						</svg>
						Loading your repositories…
					</div>
				{:then repos}
					{@const filteredRepos = repoSearch
						? repos.filter((r) =>
								`${r.owner}/${r.name}`.toLowerCase().includes(repoSearch.toLowerCase())
							)
						: repos}
					{#if repos.length > 0}
						<div class="flex flex-col gap-2">
							{#if repos.length > 6}
								<input
									type="text"
									placeholder="Filter repositories…"
									bind:value={repoSearch}
									class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-secondary/60 focus:border-brand focus:outline-none"
								/>
							{/if}
							<div class="max-h-56 overflow-y-auto rounded-lg border border-border">
								{#each filteredRepos as repo}
									<button
										type="button"
										onclick={() => selectRepo(repo.owner, repo.name)}
										class="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted"
									>
										<span class="font-mono text-sm text-text">{repo.owner}/{repo.name}</span>
										{#if repo.description}
											<span class="truncate text-xs text-text-secondary">{repo.description}</span>
										{/if}
									</button>
								{:else}
									<p class="px-4 py-3 text-sm text-text-secondary/60">No repositories match.</p>
								{/each}
							</div>
						</div>
					{:else}
						<p class="text-sm text-text-secondary">
							No public repositories with write access found.
						</p>
					{/if}
				{/await}
			{/if}
		</div>

		<!-- Artifact sources -->
		<div class="rounded-xl border border-border bg-surface p-4 sm:p-6">
			<h2 class="mb-1 text-sm font-semibold text-text">Artifact Sources</h2>
			<p class="mb-5 text-sm text-text-secondary">
				Where the compiled JARs are published. Select one or both.
			</p>

			<div class="flex flex-col gap-5">
				<!-- GitHub Releases -->
				<div class="flex flex-col gap-3">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							name="useGithubReleases"
							bind:checked={useGithubReleases}
							class="accent-brand"
						/>
						<span class="font-medium">GitHub Releases</span>
					</label>

					{#if useGithubReleases}
						<div class="ml-3 flex flex-col gap-3 sm:ml-6">
							<label class="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
								<input type="checkbox" bind:checked={sameAsCodeSource} class="accent-brand" />
								Same repository as code source
							</label>

							{#if sameAsCodeSource}
								<input type="hidden" name="artifactOwner" value={githubOwner} />
								<input type="hidden" name="artifactRepo" value={githubRepo} />
							{:else}
								<div class="flex flex-col gap-3 sm:flex-row">
									<label class="flex flex-1 flex-col gap-1.5">
										<span class="text-sm text-text-secondary"
											>Owner <span class="text-danger">*</span></span
										>
										<input
											type="text"
											name="artifactOwner"
											placeholder="acme-corp"
											class="rounded-lg border border-border bg-surface-muted px-4 py-2 text-text placeholder-text-secondary focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
										/>
									</label>
									<label class="flex flex-1 flex-col gap-1.5">
										<span class="text-sm text-text-secondary"
											>Repo <span class="text-danger">*</span></span
										>
										<input
											type="text"
											name="artifactRepo"
											placeholder="keycloak-my-extension"
											class="rounded-lg border border-border bg-surface-muted px-4 py-2 text-text placeholder-text-secondary focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
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
							class="accent-brand"
						/>
						<span class="font-medium">Maven Central</span>
					</label>

					{#if useMavenCentral}
						<div class="ml-3 flex flex-col gap-3 sm:ml-6 sm:flex-row">
							<label class="flex flex-1 flex-col gap-1.5">
								<span class="text-sm text-text-secondary"
									>Group ID <span class="text-danger">*</span></span
								>
								<input
									type="text"
									name="mavenGroupId"
									placeholder="com.example"
									class="rounded-lg border border-border bg-surface-muted px-4 py-2 text-text placeholder-text-secondary focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
								/>
							</label>
							<label class="flex flex-1 flex-col gap-1.5">
								<span class="text-sm text-text-secondary"
									>Artifact ID <span class="text-danger">*</span></span
								>
								<input
									type="text"
									name="mavenArtifactId"
									placeholder="keycloak-my-extension"
									class="rounded-lg border border-border bg-surface-muted px-4 py-2 text-text placeholder-text-secondary focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
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
			class="rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/85 disabled:cursor-not-allowed disabled:opacity-40"
		>
			Publish & Sync
		</button>
	</form>
</div>
