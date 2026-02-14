<script lang="ts">
	import './layout.css';

	let { children, data } = $props();
</script>

<svelte:head>
	<title>Keycloak Extension Registry</title>
	<meta name="description" content="Community-driven extension registry for Keycloak" />
</svelte:head>

<div class="app">
	<header>
		<nav class="container">
			<a href="/" class="logo">
				<span class="logo-icon">🔐</span>
				<span class="logo-text">KC Extensions</span>
			</a>

			<div class="nav-links">
				<a href="/">Browse</a>
				<a href="/publish">Publish</a>
			</div>

			<div class="nav-auth">
				{#if data?.user}
					<a href="/dashboard" class="user-menu">
						<img src={data.user.avatarUrl} alt="" class="avatar" />
						<span>{data.user.username}</span>
					</a>
				{:else}
					<a href="/api/auth/login" class="btn btn-primary">
						Sign in with GitHub
					</a>
				{/if}
			</div>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>

	<footer class="container">
		<p>
			Keycloak Extension Registry ·
			<a href="https://github.com/keycloak-extension-registry" target="_blank">GitHub</a>
		</p>
	</footer>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	header {
		background: var(--color-bg-secondary, #1a1a2e);
		border-bottom: 1px solid var(--color-border, #2a2a4a);
		padding: 1rem 0;
	}

	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		font-weight: 600;
		font-size: 1.25rem;
		color: inherit;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.nav-links {
		display: flex;
		gap: 1.5rem;
	}

	.nav-links a {
		text-decoration: none;
		color: var(--color-text-secondary, #a0a0c0);
		transition: color 0.2s;
	}

	.nav-links a:hover {
		color: var(--color-text, #fff);
	}

	.nav-auth {
		margin-left: auto;
	}

	.user-menu {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: inherit;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		text-decoration: none;
		font-weight: 500;
		transition: background 0.2s;
	}

	.btn-primary {
		background: var(--color-primary, #6366f1);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover, #4f46e5);
	}

	main {
		flex: 1;
		padding: 2rem 0;
	}

	footer {
		padding: 2rem 0;
		text-align: center;
		color: var(--color-text-secondary, #a0a0c0);
		font-size: 0.875rem;
	}

	footer a {
		color: inherit;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}
</style>
