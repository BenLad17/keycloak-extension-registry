<script lang="ts">
	import './layout.css';
	import { Github, Sun, Moon } from 'lucide-svelte';
	import { page } from '$app/state';

	let { children, data } = $props();

	function navClass(href: string) {
		const active = page.url.pathname === href || page.url.pathname.startsWith(href + '/');
		return active
			? 'rounded-md px-3 py-1.5 text-sm font-medium text-text no-underline bg-surface-muted'
			: 'rounded-md px-3 py-1.5 text-sm text-text-secondary no-underline transition-colors hover:bg-surface-muted hover:text-text';
	}

	let isDark = $state(false);

	$effect(() => {
		const root = document.documentElement;
		isDark =
			root.classList.contains('dark') ||
			(!root.classList.contains('light') &&
				window.matchMedia('(prefers-color-scheme: dark)').matches);
	});

	function toggleTheme() {
		isDark = !isDark;
		const root = document.documentElement;
		if (isDark) {
			root.classList.add('dark');
			root.classList.remove('light');
			localStorage.setItem('theme', 'dark');
		} else {
			root.classList.remove('dark');
			root.classList.add('light');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<svelte:head>
	<title>Keycloak Extension Registry</title>
	<meta name="description" content="Browse, install, and publish community extensions for Keycloak. Releases tracked from GitHub and Maven Central, versioned and reproducible." />
	<meta property="og:site_name" content="Keycloak Extension Registry" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Keycloak Extension Registry" />
	<meta property="og:description" content="Browse, install, and publish community extensions for Keycloak. Releases tracked from GitHub and Maven Central, versioned and reproducible." />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Keycloak Extension Registry" />
	<meta name="twitter:description" content="Browse, install, and publish community extensions for Keycloak." />
</svelte:head>

<div class="flex min-h-screen flex-col bg-bg">
	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
		<nav class="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
			<!-- Wordmark -->
			<a href="/" class="flex items-baseline gap-1.5 no-underline">
				<span class="text-sm font-semibold tracking-tight text-text">Keycloak</span>
				<span class="text-sm font-medium text-text-secondary">Extension Registry</span>
			</a>

			<!-- Navigation -->
			<div class="absolute left-1/2 flex -translate-x-1/2 items-center gap-0.5">
				<a href="/explore" class={navClass('/explore')}>Explore</a>
				<a href="/publish" class={navClass('/publish')}>Publish</a>
				<a href="/docs" class={navClass('/docs')}>Docs</a>
			</div>

			<!-- Theme toggle + Auth -->
			<div class="flex items-center gap-1.5">
				<button
					onclick={toggleTheme}
					aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
					class="rounded-md p-1.5 text-text-secondary/60 transition-colors hover:bg-surface-muted hover:text-text-secondary"
				>
					{#if isDark}
						<Sun class="h-4 w-4" />
					{:else}
						<Moon class="h-4 w-4" />
					{/if}
				</button>

				{#if data?.user}
					<a
						href="/dashboard"
						class="group flex items-center gap-2 rounded-md px-2.5 py-1.5 text-text no-underline transition-colors hover:bg-surface-muted"
					>
						<img
							src={data.user.avatarUrl}
							alt=""
							class="h-6 w-6 rounded-full ring-1 ring-border"
						/>
						<span class="text-sm font-medium">{data.user.login}</span>
					</a>
					<form method="POST" action="/api/auth/logout">
						<button
							type="submit"
							class="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text"
						>
							Sign out
						</button>
					</form>
				{:else}
					<a
						href="/api/auth/login"
						class="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-sm font-medium text-white no-underline transition-colors hover:bg-brand/85"
					>
						<Github class="h-4 w-4" />
						Sign in
					</a>
				{/if}
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		<div class="mx-auto max-w-7xl px-6 py-10">
			{@render children()}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
			<p class="text-xs text-text-secondary/60">Keycloak Extension Registry</p>
			<div class="flex items-center gap-5 text-xs">
				<a href="/docs" class="text-text-secondary/60 no-underline transition-colors hover:text-text-secondary">Docs</a>
				<a
					href="https://github.com/keycloak-extension-registry"
					target="_blank"
					class="flex items-center gap-1 text-text-secondary/60 no-underline transition-colors hover:text-text-secondary"
				>
					<Github class="h-3.5 w-3.5" />
					GitHub
				</a>
			</div>
		</div>
	</footer>
</div>
