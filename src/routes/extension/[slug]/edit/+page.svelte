<script lang="ts">
	import { enhance } from '$app/forms';

	import { ExtensionCategoryLabel } from '$lib/common/extension-category';

	let { data, form } = $props();
	const ext = $derived(data.extension);

	let deleteConfirmed = $state(false);
</script>

<svelte:head>
	<title>Edit {ext.name} – Keycloak Extension Registry</title>
</svelte:head>

<div class="mx-auto max-w-2xl py-12">
	<a
		href="/extension/{ext.slug}"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 no-underline transition-colors hover:text-gray-300"
	>
		← Back to extension
	</a>

	<h1 class="mt-4 mb-2 text-3xl font-bold">Edit Extension</h1>
	<p class="mb-8 text-gray-400">
		Update the details for <strong class="text-white">{ext.name}</strong>.
	</p>

	{#if form?.error}
		<div
			class="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
		>
			{form.error}
		</div>
	{/if}

	{#if form?.synced}
		<div
			class="mb-6 rounded-xl border border-green-600/30 bg-green-600/10 px-4 py-3 text-sm text-green-400"
		>
			Extension synced successfully. Versions and README have been updated.
		</div>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-6">
		<div class="rounded-2xl border border-border bg-bg-secondary p-6">
			<h2 class="mb-4 text-lg font-semibold">Details</h2>

			<div class="flex flex-col gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-gray-300">Name</span>
					<input
						name="name"
						type="text"
						value={ext.name}
						required
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
					/>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-gray-300">Description</span>
					<textarea
						name="description"
						rows="3"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
						>{ext.description ?? ''}</textarea
					>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-gray-300">Category</span>
					<select
						name="category"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
					>
						{#each Object.entries(ExtensionCategoryLabel) as [value, label]}
							<option {value} selected={ext.category === value}>{label}</option>
						{/each}
					</select>
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-sm font-medium text-gray-300">Status</span>
					<select
						name="status"
						class="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
					>
						<option value="active" selected={ext.status === 'active'}>Active</option>
						<option value="archived" selected={ext.status === 'archived'}>Archived</option>
					</select>
					<p class="text-xs text-gray-600">
						Archived extensions are hidden from search and show a deprecation warning.
					</p>
				</label>
			</div>
		</div>

		<div class="flex justify-end gap-3">
			<a
				href="/extension/{ext.slug}"
				class="rounded-lg border border-border px-5 py-2.5 text-sm text-gray-400 no-underline transition-colors hover:border-gray-500 hover:text-white"
			>
				Cancel
			</a>
			<button
				type="submit"
				class="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
			>
				Save changes
			</button>
		</div>
	</form>

	<!-- Sync -->
	<div class="mt-6 rounded-2xl border border-border bg-bg-secondary p-6">
		<h2 class="mb-1 text-base font-semibold">Sync now</h2>
		<p class="mb-4 text-sm text-gray-500">
			Fetch the latest releases, README, and download counts from GitHub and Maven Central.
		</p>
		<form method="POST" action="?/sync" use:enhance>
			<button
				type="submit"
				class="rounded-lg border border-border px-4 py-2 text-sm text-gray-300 transition-colors hover:border-indigo-500/50 hover:text-white"
			>
				Sync extension
			</button>
		</form>
	</div>

	<!-- Danger zone -->
	<div class="mt-6 rounded-2xl border border-red-500/20 bg-bg-secondary p-6">
		<h2 class="mb-1 text-base font-semibold text-red-400">Danger zone</h2>
		<p class="mb-4 text-sm text-gray-500">
			Permanently deletes this extension and all its versions and files. This cannot be undone.
		</p>
		<label class="mb-4 flex items-center gap-2 text-sm text-gray-400">
			<input
				type="checkbox"
				bind:checked={deleteConfirmed}
				class="rounded border-border accent-red-500"
			/>
			I understand this will permanently delete <strong class="text-white">{ext.name}</strong>.
		</label>
		<form method="POST" action="?/delete" use:enhance>
			<button
				type="submit"
				disabled={!deleteConfirmed}
				class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
			>
				Delete extension
			</button>
		</form>
	</div>
</div>
