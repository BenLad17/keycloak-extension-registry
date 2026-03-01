<script lang="ts">
	import './layout.css';
	import { Github } from 'lucide-svelte';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>Keycloak Extension Registry</title>
	<meta name="description" content="Community-driven extension registry for Keycloak" />
</svelte:head>

<div class="flex min-h-screen flex-col bg-bg">
	<!-- Header -->
	<header class="sticky top-0 z-50 border-b border-border bg-bg-secondary/80 backdrop-blur-md">
		<nav class="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
			<!-- Logo -->
			<a href="/" class="group flex items-center gap-3 no-underline">
				<div
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-indigo-500 to-purple-600 text-lg shadow-lg shadow-indigo-500/20"
				>
					🔐
				</div>
				<span
					class="text-lg font-semibold text-white transition-colors group-hover:text-indigo-400"
				>
					Keycloak Extension Registry
				</span>
			</a>

			<!-- Navigation -->
			<div class="absolute left-1/2 flex -translate-x-1/2 items-center gap-1">
				<a
					href="/"
					class="rounded-lg px-4 py-2 text-gray-400 no-underline transition-all hover:bg-white/5 hover:text-white"
				>
					Browse
				</a>
				<a
					href="/publish"
					class="rounded-lg px-4 py-2 text-gray-400 no-underline transition-all hover:bg-white/5 hover:text-white"
				>
					Publish
				</a>
				<a
					href="/docs"
					class="rounded-lg px-4 py-2 text-gray-400 no-underline transition-all hover:bg-white/5 hover:text-white"
				>
					Docs
				</a>
			</div>

			<!-- Auth -->
			<div class="flex items-center gap-2">
				{#if data?.user}
					<a
						href="/dashboard"
						class="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-white no-underline transition-all hover:bg-white/5"
					>
						<img
							src={data.user.avatarUrl}
							alt=""
							class="h-8 w-8 rounded-full ring-2 ring-transparent transition-all group-hover:ring-indigo-500/50"
						/>
						<span class="text-sm font-medium">{data.user.login}</span>
					</a>
					<form method="POST" action="/api/auth/logout">
						<button
							type="submit"
							class="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
						>
							Sign out
						</button>
					</form>
				{:else}
					<a
						href="/api/auth/login"
						class="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white no-underline shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-indigo-500/30"
					>
						<Github class="h-5 w-5" />
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
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-8">
			<p class="text-sm text-gray-500">Keycloak Extension Registry</p>
			<div class="flex items-center gap-6 text-sm">
				<a href="/docs" class="text-gray-500 transition-colors hover:text-white">Docs</a>
				<a
					href="https://github.com/keycloak-extension-registry"
					target="_blank"
					class="flex items-center gap-1.5 text-gray-500 transition-colors hover:text-white"
				>
					<Github class="h-4 w-4" />
					GitHub
				</a>
			</div>
		</div>
	</footer>
</div>
