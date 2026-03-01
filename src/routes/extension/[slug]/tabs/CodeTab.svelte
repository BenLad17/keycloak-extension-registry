<script lang="ts">
	import { ChevronRight, FileText, FileCode2, Copy, Check, X } from 'lucide-svelte';
	import { highlightByExtension } from '$lib/hljs';
	import type { ExtensionVersion } from '$lib/server/db';

	interface VersionFile {
		path: string;
		content: string;
	}

	interface TreeNode {
		name: string;
		fullPath: string;
		type: 'file' | 'dir';
		content: string;
		children: TreeNode[];
	}

	let {
		versions,
		latestVersion,
		extensionSlug
	}: {
		versions: ExtensionVersion[];
		latestVersion: ExtensionVersion | null;
		extensionSlug: string;
	} = $props();

	let codeVersionId = $state<number | null>(null);
	const codeVersion = $derived(
		codeVersionId !== null
			? (versions.find((v) => v.id === codeVersionId) ?? latestVersion)
			: latestVersion
	);

	let versionFiles = $state<VersionFile[] | null>(null);
	let filesLoading = $state(false);
	let loadedVersionId = $state<number | null>(null);
	let selectedFile = $state<VersionFile | null>(null);
	let fileSearch = $state('');
	let expandedDirs = $state(new Set<string>());
	let codeCopied = $state(false);

	$effect(() => {
		if (codeVersion) loadFiles(codeVersion);
	});

	async function loadFiles(version: ExtensionVersion) {
		if (loadedVersionId === version.id) return;
		filesLoading = true;
		versionFiles = null;
		selectedFile = null;
		expandedDirs = new Set();
		try {
			const res = await fetch(`/extension/${extensionSlug}/${version.version}/files`);
			versionFiles = await res.json();
			loadedVersionId = version.id;
		} catch {
			versionFiles = [];
		} finally {
			filesLoading = false;
		}
	}

	function switchCodeVersion(id: number) {
		codeVersionId = id;
		selectedFile = null;
		fileSearch = '';
		loadedVersionId = null;
	}

	async function copyCode() {
		if (!selectedFile) return;
		await navigator.clipboard.writeText(selectedFile.content);
		codeCopied = true;
		setTimeout(() => (codeCopied = false), 2000);
	}

	function toggleDir(path: string) {
		const next = new Set(expandedDirs);
		next.has(path) ? next.delete(path) : next.add(path);
		expandedDirs = next;
	}

	const fileTree = $derived(buildTree(versionFiles ?? []));
	const activeTree = $derived(fileSearch ? filterTree(fileTree, fileSearch) : fileTree);
	const matchCount = $derived(fileSearch ? countLeaves(activeTree) : null);

	function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
		const q = query.toLowerCase();
		const out: TreeNode[] = [];
		for (const node of nodes) {
			if (node.type === 'file') {
				if (node.fullPath.toLowerCase().includes(q)) out.push(node);
			} else {
				const children = filterTree(node.children, q);
				if (children.length > 0) out.push({ ...node, children });
			}
		}
		return out;
	}

	function countLeaves(nodes: TreeNode[]): number {
		let n = 0;
		for (const node of nodes) n += node.type === 'file' ? 1 : countLeaves(node.children);
		return n;
	}

	function buildTree(files: VersionFile[]): TreeNode[] {
		const root: TreeNode[] = [];
		for (const file of files) {
			const parts = file.path.split('/');
			let nodes = root;
			let pathSoFar = '';
			for (let i = 0; i < parts.length; i++) {
				pathSoFar = pathSoFar ? `${pathSoFar}/${parts[i]}` : parts[i];
				const isLeaf = i === parts.length - 1;
				let node = nodes.find((n) => n.name === parts[i]);
				if (!node) {
					node = {
						name: parts[i],
						fullPath: pathSoFar,
						type: isLeaf ? 'file' : 'dir',
						content: isLeaf ? file.content : '',
						children: []
					};
					nodes.push(node);
					nodes.sort((a, b) => {
						if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
						return a.name.localeCompare(b.name);
					});
				}
				if (!isLeaf) nodes = node.children;
			}
		}
		return root;
	}
</script>

{#if versions.length === 0}
	<div
		class="flex flex-col items-center gap-3 rounded-2xl border border-border bg-bg-secondary/50 py-20 text-center"
	>
		<FileCode2 class="h-10 w-10 text-gray-700" />
		<p class="text-sm font-medium text-gray-400">No files available</p>
		<p class="text-xs text-gray-600">Source files will appear here once versions are synced.</p>
	</div>
{:else}
	<div class="overflow-hidden rounded-2xl border border-border bg-bg-secondary">
		<!-- Controls bar -->
		<div class="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
			<select
				class="rounded-lg border border-border bg-bg px-3 py-1.5 font-mono text-sm text-white focus:border-indigo-500 focus:outline-none"
				onchange={(e) =>
					switchCodeVersion(parseInt((e.currentTarget as HTMLSelectElement).value, 10))}
			>
				{#each versions as v}
					<option value={v.id} selected={v.id === (codeVersion?.id ?? latestVersion?.id)}>
						{v.version}{v.id === latestVersion?.id ? ' (latest)' : ''}
					</option>
				{/each}
			</select>

			{#if versionFiles !== null}
				<input
					type="search"
					placeholder="Search files…"
					bind:value={fileSearch}
					class="w-56 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
				/>
				<span class="text-xs text-gray-600">
					{fileSearch ? `${matchCount} of ` : ''}{versionFiles.length} files
				</span>
			{/if}
		</div>

		<!-- Browser -->
		{#if filesLoading}
			<div class="flex items-center justify-center py-20 text-sm text-gray-600">Loading files…</div>
		{:else if versionFiles === null}
			<div class="py-20 text-center text-sm text-gray-600">
				Files not available for this version.
			</div>
		{:else if versionFiles.length === 0}
			<div class="py-20 text-center text-sm text-gray-600">
				No browsable files for this version.
			</div>
		{:else}
			<div class="flex" style="height: 600px">
				<!-- File tree -->
				<div class="w-72 shrink-0 overflow-auto border-r border-border">
					{#if activeTree.length === 0 && fileSearch}
						<p class="px-3 py-4 text-xs text-gray-600">No files match.</p>
					{:else}
						{#snippet treeNodes(nodes: TreeNode[], depth: number)}
							{#each nodes as node}
								{#if node.type === 'dir'}
									<div>
										<button
											onclick={() => !fileSearch && toggleDir(node.fullPath)}
											class="flex min-w-full items-center gap-1.5 py-1 text-left font-mono text-xs text-gray-500 transition-colors hover:text-gray-300"
											style="padding-left: {0.75 + depth * 0.875}rem; padding-right: 0.75rem"
										>
											<ChevronRight
												class="h-3 w-3 shrink-0 transition-transform {fileSearch ||
												expandedDirs.has(node.fullPath)
													? 'rotate-90'
													: ''}"
											/>
											<span class="whitespace-nowrap">{node.name}</span>
										</button>
										{#if fileSearch || expandedDirs.has(node.fullPath)}
											{@render treeNodes(node.children, depth + 1)}
										{/if}
									</div>
								{:else}
									<button
										onclick={() => (selectedFile = { path: node.fullPath, content: node.content })}
										class="flex min-w-full items-center gap-1.5 py-1 text-left font-mono text-xs transition-colors {selectedFile?.path ===
										node.fullPath
											? 'bg-indigo-600/15 text-indigo-300'
											: 'text-gray-400 hover:bg-bg hover:text-gray-200'}"
										style="padding-left: {0.75 + depth * 0.875 + 1.125}rem; padding-right: 0.75rem"
									>
										<span class="whitespace-nowrap" title={node.fullPath}>{node.name}</span>
									</button>
								{/if}
							{/each}
						{/snippet}
						{@render treeNodes(activeTree, 0)}
					{/if}
				</div>

				<!-- Content pane -->
				<div class="flex min-w-0 flex-1 flex-col overflow-hidden">
					{#if !selectedFile}
						<div class="flex flex-1 flex-col items-center justify-center gap-2 text-gray-600">
							<FileText class="h-8 w-8 opacity-20" />
							<p class="text-sm">Select a file to view its contents</p>
						</div>
					{:else}
						<!-- Path bar -->
						<div
							class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2"
						>
							<span
								class="min-w-0 truncate font-mono text-xs text-gray-500"
								title={selectedFile.path}
							>
								{selectedFile.path}
							</span>
							<div class="flex shrink-0 items-center gap-1">
								<button
									onclick={copyCode}
									class="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
								>
									{#if codeCopied}
										<Check class="h-3.5 w-3.5 text-green-400" />
										<span class="text-green-400">Copied</span>
									{:else}
										<Copy class="h-3.5 w-3.5" />
										Copy
									{/if}
								</button>
								<button
									onclick={() => (selectedFile = null)}
									class="ml-1 shrink-0 text-gray-600 hover:text-gray-300"
									aria-label="Close"
								>
									<X class="h-4 w-4" />
								</button>
							</div>
						</div>

						<!-- Source with line numbers -->
						<div class="flex min-h-0 flex-1 overflow-auto bg-bg-secondary">
							<div
								class="sticky left-0 shrink-0 border-r border-border bg-bg-secondary px-3 py-4 text-right font-mono text-xs leading-relaxed text-gray-600 select-none"
							>
								{#each { length: selectedFile.content.split('\n').length } as _, i}
									<div>{i + 1}</div>
								{/each}
							</div>
							<pre
								class="hljs m-0 min-w-max flex-1 rounded-none p-4 font-mono text-xs leading-relaxed"><code
									>{@html highlightByExtension(selectedFile.content, selectedFile.path)}</code
								></pre>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
