<script lang="ts">
	import { enhance } from '$app/forms';

	import { ExtensionCategoryLabel } from '$lib/common/extension-category';

	let { data, form } = $props();
	const ext = $derived(data.extension);

	let deleteConfirmed = $state(false);
</script>

<svelte:head>
	<title>Edit {ext.name} - Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-2xl py-12">
	<a
		href="/extension/{ext.slug}"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-text-secondary no-underline transition-colors hover:text-text"
	>
		← Back to extension
	</a>

	<h1 class="mt-4 mb-2 text-2xl font-semibold">Edit Extension</h1>
	<p class="mb-8 text-text-secondary">
		Update the details for <strong class="text-text">{ext.name}</strong>.
	</p>

	{#if form?.error}
		<div
			class="mb-6 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
		>
			{form.error}
		</div>
	{/if}

	{#if form?.synced}
		<div
			class="mb-6 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
		>
			Extension synced successfully. Versions and README have been updated.
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-6">
		<div class="rounded-xl border border-border bg-surface p-6">
			<h2 class="card-title">Details</h2>

			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-text-secondary">Name</span>
					<input
						name="name"
						type="text"
						value={ext.name}
						required
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-secondary/60 focus:border-brand focus:outline-none"
					/>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-text-secondary">Description</span>
					<textarea
						name="description"
						rows="3"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder-text-secondary/60 focus:border-brand focus:outline-none"
						>{ext.description ?? ''}</textarea
					>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-text-secondary">Category</span>
					<select
						name="category"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
					>
						{#each Object.entries(ExtensionCategoryLabel) as [value, label]}
							<option {value} selected={ext.category === value}>{label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-text-secondary">Status</span>
					<select
						name="status"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-brand focus:outline-none"
					>
						<option value="active" selected={ext.status === 'active'}>Active</option>
						<option value="archived" selected={ext.status === 'archived'}>Archived</option>
					</select>
					<p class="text-xs text-text-secondary/60">
						Archived extensions are hidden from search and show a deprecation warning.
					</p>
				</label>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<a
				href="/extension/{ext.slug}"
				class="rounded-lg border border-border px-5 py-2.5 text-sm text-text-secondary no-underline transition-colors hover:border-border/60 hover:text-text"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/80"
			>
				Save changes
			</button>
		</div>
	</form>

	<!-- Sync -->
	<div class="mt-6 rounded-xl border border-border bg-surface p-6">
		<h2 class="mb-1 text-sm font-semibold text-text">Sync now</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Fetch the latest releases, README, and download counts from GitHub and Maven Central.
		</p>
		<form method="POST" action="?/sync" use:enhance>
			<button
				type="submit"
				class="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-brand/50 hover:text-text"
			>
				Sync extension
			</button>
		</form>
	</div>

	<!-- Danger zone -->
	<div class="mt-6 rounded-xl border border-danger/20 bg-surface p-6">
		<h2 class="mb-1 text-sm font-semibold text-danger">Danger zone</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Permanently deletes this extension and all its versions and files. This cannot be undone.
		</p>
		<label class="mb-4 flex items-center gap-2 text-sm text-text-secondary">
			<input
				type="checkbox"
				bind:checked={deleteConfirmed}
				class="rounded border-border accent-danger"
			/>
			I understand this will permanently delete <strong class="text-text">{ext.name}</strong>.
		</label>
		<form method="POST" action="?/delete" use:enhance>
			<button
				type="submit"
				disabled={!deleteConfirmed}
				class="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-danger/80 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Delete extension
			</button>
		</form>
	</div>
</div>
