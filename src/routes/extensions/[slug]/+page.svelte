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

	let selectedVersion = $state(data.versions[0]?.version ?? '');
	let copied = $state(false);

	$effect(() => {
		if (data.versions.length > 0 && !selectedVersion) {
			selectedVersion = data.versions[0].version;
		}
	});

	const currentVersion = $derived(
		(data.versions as VersionData[]).find((v) => v.version === selectedVersion) ?? (data.versions[0] as VersionData | undefined)
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

<div class="container">
	<div class="extension-detail">
		<header class="extension-header">
			<div class="header-main">
				<h1>{data.extension.name}</h1>
				<span class="category-badge">{data.extension.category}</span>
				{#if data.isPending}
					<span class="status-badge pending">⏳ Pending Release</span>
				{/if}
			</div>

			{#if data.isPending}
				<div class="pending-banner">
					<p>
						<strong>This extension is waiting for its first release.</strong>
						Once the owner publishes a GitHub release with a JAR file, it will become available for download.
					</p>
				</div>
			{/if}

			<p class="description">{data.extension.description}</p>

			<div class="meta">
				{#if data.owner}
					<span class="author">
						<img src={data.owner.avatarUrl} alt="" class="avatar" />
						{data.owner.username}
					</span>
				{/if}
				<span class="downloads">📦 {data.extension.downloadCount?.toLocaleString() ?? 0} downloads</span>
				{#if data.extension.license}
					<span class="license">📄 {data.extension.license}</span>
				{/if}
			</div>

			<div class="links">
				<a href="https://github.com/{data.extension.githubRepo}" target="_blank" class="btn">
					View on GitHub
				</a>
				{#if data.extension.homepage}
					<a href={data.extension.homepage} target="_blank" class="btn">
						Homepage
					</a>
				{/if}
			</div>
		</header>

		<div class="content-grid">
			{#if data.versions.length > 0}
				<section class="install-section">
					<h2>Installation</h2>

					<div class="version-selector">
						<label for="version">Version:</label>
						<select id="version" bind:value={selectedVersion}>
							{#each data.versions as v}
								<option value={v.version}>
									{v.version}
									{#if v.deprecated}(deprecated){/if}
								</option>
							{/each}
						</select>
					</div>

					{#if currentVersion}
						<div class="compatibility">
							<h3>Keycloak Compatibility</h3>
							<p>
								{currentVersion.keycloakCompatibility.min} - {currentVersion.keycloakCompatibility.max}
							</p>
							{#if currentVersion.keycloakCompatibility.tested?.length}
								<p class="tested">
									Tested: {currentVersion.keycloakCompatibility.tested.join(', ')}
								</p>
							{/if}
						</div>

						{#if currentVersion.deprecated}
							<div class="warning">
								⚠️ This version is deprecated.
								{#if currentVersion.deprecationMessage}
									{currentVersion.deprecationMessage}
								{/if}
							</div>
						{/if}
					{/if}

					<div class="manifest-box">
						<h3>Add to extensions.yaml</h3>
						<pre><code>{manifestEntry}</code></pre>
						<button onclick={copyManifest} class="btn btn-primary">
							{copied ? '✓ Copied!' : '📋 Copy'}
						</button>
					</div>

					{#if currentVersion}
						<div class="direct-download">
							<h3>Direct Download</h3>
							<p>
								<a href={currentVersion.jarUrl}>
									Download JAR ({((currentVersion.jarSize ?? 0) / 1024).toFixed(0)} KB)
								</a>
							</p>
							<p class="sha256">SHA256: <code>{currentVersion.sha256}</code></p>
						</div>
					{/if}
				</section>

				<section class="versions-section">
					<h2>Versions</h2>

					<div class="versions-list">
						{#each data.versions as v}
							<div class="version-item" class:active={v.version === selectedVersion}>
								<div class="version-header">
									<button onclick={() => (selectedVersion = v.version)} class="version-select">
										<strong>{v.version}</strong>
										{#if v.deprecated}
											<span class="deprecated-badge">deprecated</span>
										{/if}
									</button>
									<span class="date">{formatDate(v.publishedAt)}</span>
								</div>
								{#if v.releaseNotes}
									<p class="release-notes">{v.releaseNotes}</p>
								{/if}
						</div>
					{/each}
				</div>
			</section>
			{:else}
				<section class="no-versions-section">
					<div class="no-versions-message">
						<h2>📦 No Versions Available Yet</h2>
						<p>
							This extension has been registered but no releases have been published yet.
						</p>
						<p>
							Check back later or watch the
							<a href="https://github.com/{data.extension.githubRepo}" target="_blank">GitHub repository</a>
							for updates.
						</p>
					</div>
				</section>
			{/if}
		</div>
	</div>
</div>

<style>
	.extension-header {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border, #2a2a4a);
	}

	.header-main {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.header-main h1 {
		margin: 0;
	}

	.category-badge {
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
		background: var(--color-primary, #6366f1);
		border-radius: 0.25rem;
	}

	.status-badge {
		font-size: 0.75rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
	}

	.status-badge.pending {
		background: rgba(255, 193, 7, 0.2);
		color: #ffc107;
		border: 1px solid rgba(255, 193, 7, 0.3);
	}

	.pending-banner {
		background: rgba(255, 193, 7, 0.1);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	.pending-banner p {
		margin: 0;
		font-size: 0.9rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.description {
		font-size: 1.125rem;
		color: var(--color-text-secondary, #a0a0c0);
		margin-bottom: 1rem;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
	}

	.links {
		display: flex;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
		background: transparent;
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.btn:hover {
		border-color: var(--color-primary, #6366f1);
	}

	.btn-primary {
		background: var(--color-primary, #6366f1);
		border-color: var(--color-primary, #6366f1);
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}

	@media (max-width: 768px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}

	section h2 {
		margin-bottom: 1rem;
	}

	.version-selector {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 1rem;
	}

	.version-selector select {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
		background: var(--color-bg-secondary, #1a1a2e);
		color: inherit;
	}

	.compatibility {
		padding: 1rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.compatibility h3 {
		margin: 0 0 0.5rem;
		font-size: 0.875rem;
	}

	.compatibility p {
		margin: 0;
	}

	.tested {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.warning {
		padding: 1rem;
		background: #4a2c00;
		border: 1px solid #8b5500;
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.manifest-box {
		padding: 1rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border-radius: 0.5rem;
		margin-bottom: 1rem;
	}

	.manifest-box h3 {
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
	}

	.manifest-box pre {
		padding: 1rem;
		background: #0d0d1a;
		border-radius: 0.25rem;
		overflow-x: auto;
		margin-bottom: 0.75rem;
	}

	.direct-download {
		font-size: 0.875rem;
	}

	.sha256 {
		word-break: break-all;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.sha256 code {
		font-size: 0.75rem;
	}

	.versions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.version-item {
		padding: 1rem;
		background: var(--color-bg-secondary, #1a1a2e);
		border: 1px solid var(--color-border, #2a2a4a);
		border-radius: 0.5rem;
	}

	.version-item.active {
		border-color: var(--color-primary, #6366f1);
	}

	.version-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.version-select {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.deprecated-badge {
		font-size: 0.75rem;
		padding: 0.125rem 0.375rem;
		background: #8b5500;
		border-radius: 0.25rem;
	}

	.date {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.release-notes {
		margin: 0.75rem 0 0;
		font-size: 0.875rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.no-versions-section {
		grid-column: 1 / -1;
	}

	.no-versions-message {
		text-align: center;
		padding: 3rem;
		background: rgba(255, 193, 7, 0.1);
		border: 1px solid rgba(255, 193, 7, 0.3);
		border-radius: 0.75rem;
	}

	.no-versions-message h2 {
		margin: 0 0 1rem;
	}

	.no-versions-message p {
		margin: 0 0 0.5rem;
		color: var(--color-text-secondary, #a0a0c0);
	}

	.no-versions-message p:last-child {
		margin: 0;
	}

	.no-versions-message a {
		color: var(--color-primary, #6366f1);
	}
</style>
