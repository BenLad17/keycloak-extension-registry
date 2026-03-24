<svelte:head>
	<title>Introduction - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-4 text-2xl font-semibold tracking-tight">How it works</h1>
		<div class="space-y-3 text-base leading-relaxed text-text-secondary">
			<p>
				Keycloak extensions (called <em>providers</em>) are JAR files placed in
				<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text"
					>/opt/keycloak/providers/</code
				>
				before running
				<code class="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-text">kc.sh build</code
				>. Finding and keeping track of community extensions across GitHub and Maven Central is
				tedious.
			</p>
			<p>
				This registry is a central index of community extensions. You can browse by category, read
				changelogs, download JARs directly from each extension's page, or use one of the three
				Maven-native install patterns to automate extension management in your project.
			</p>
		</div>
	</div>

	<section>
		<h2 class="mb-6 text-xl font-semibold text-text">Installing extensions</h2>
		<div class="space-y-4">
			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">A</span>
					<div>
						<h3 class="font-semibold text-text">Manual download</h3>
						<p class="text-xs text-text-secondary">simplest option</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Go to any extension's Versions tab and click Download to get the JAR. Drop it into your
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
						>/opt/keycloak/providers/</code
					>
					folder and run
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">kc.sh build</code>.
					Each version shows its SHA-256 digest so you can verify the file before use.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">B</span>
					<div>
						<h3 class="font-semibold text-text">Maven dependency</h3>
						<p class="text-xs text-text-secondary">for Maven build projects</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Copy the Maven dependency snippet from any extension's Overview tab and add it to your
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">pom.xml</code>. Maven
					resolves extensions from Maven Central at build time alongside your other dependencies.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">C</span>
					<div>
						<h3 class="font-semibold text-text">YAML manifest + downloader script</h3>
						<p class="text-xs text-text-secondary">for containerised setups</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Declare your extensions in a
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
						>keycloak-extensions.yaml</code
					>
					file and run the included downloader script to fetch JARs from Maven Central into your providers
					directory. Copy the YAML manifest snippet from any extension's Overview tab.
				</p>
			</div>

			<div class="rounded-xl border border-border bg-surface/40 px-6 py-5">
				<div class="mb-3 flex items-center gap-3">
					<span class="rounded-full bg-brand/20 px-2.5 py-0.5 font-mono text-xs text-brand">D</span>
					<div>
						<h3 class="font-semibold text-text">Kubernetes init container</h3>
						<p class="text-xs text-text-secondary">for Kubernetes deployments</p>
					</div>
				</div>
				<p class="text-sm leading-relaxed text-text-secondary">
					Mount a ConfigMap containing your
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
						>keycloak-extensions.yaml</code
					>
					and add the downloader init container to your pod spec. The init container downloads all extensions
					from Maven Central into a shared
					<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">providers</code>
					volume before Keycloak starts. Copy the init container snippet from any extension's Overview
					tab.
				</p>
			</div>
		</div>
	</section>

	<div class="flex items-center justify-end border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-brand no-underline hover:text-brand/80">
			Quick start →
		</a>
	</div>
</div>
