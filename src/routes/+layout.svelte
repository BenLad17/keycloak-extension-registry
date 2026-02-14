<script lang="ts">
	import './layout.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>Keycloak Extension Registry</title>
	<meta name="description" content="Community-driven extension registry for Keycloak" />
</svelte:head>

<div class="flex flex-col min-h-screen bg-bg">
	<!-- Header -->
	<header class="sticky top-0 z-50 bg-bg-secondary/80 backdrop-blur-md border-b border-border">
		<nav class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between relative">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 no-underline group">
				<div class="w-9 h-9 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20">
					🔐
				</div>
				<span class="font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors">
					Keycloak Extension Registry
				</span>
			</a>

			<!-- Navigation -->
			<div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
				<a href="/" class="px-4 py-2 rounded-lg no-underline text-gray-400 hover:text-white hover:bg-white/5 transition-all">
					Browse
				</a>
				<a href="/publish" class="px-4 py-2 rounded-lg no-underline text-gray-400 hover:text-white hover:bg-white/5 transition-all">
					Publish
				</a>
			</div>

			<!-- Auth -->
			<div>
				{#if data?.user}
					<a href="/dashboard" class="flex items-center gap-3 px-3 py-1.5 rounded-lg no-underline text-white hover:bg-white/5 transition-all group">
						<img src={data.user.avatarUrl} alt="" class="w-8 h-8 rounded-full ring-2 ring-transparent group-hover:ring-indigo-500/50 transition-all" />
						<span class="text-sm font-medium">{data.user.username}</span>
					</a>
				{:else}
					<a href="/api/auth/login" class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg no-underline text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5">
						<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
						Sign in
					</a>
				{/if}
			</div>
		</nav>
	</header>

	<!-- Main Content -->
	<main class="flex-1">
		<div class="max-w-7xl mx-auto px-6 py-10">
			{@render children()}
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border">
		<div class="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
			<p class="text-gray-500 text-sm">
				Keycloak Extension Registry
			</p>
			<div class="flex items-center gap-6 text-sm">
				<a href="/docs" class="text-gray-500 hover:text-white transition-colors">Docs</a>
				<a href="https://github.com/keycloak-extension-registry" target="_blank" class="text-gray-500 hover:text-white transition-colors flex items-center gap-1.5">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
					GitHub
				</a>
			</div>
		</div>
	</footer>
</div>

