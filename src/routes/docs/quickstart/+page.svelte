<svelte:head>
	<title>Quick start - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Quick start</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			There are four ways to install extensions. Pick whichever fits your setup.
		</p>
	</div>

	<!-- Option A: Manual -->
	<section class="space-y-5">
		<h2 class="text-base font-semibold text-text">Option A — Manual install</h2>
		<ol class="space-y-6">
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>1</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Find an extension</p>
					<p class="mt-1 text-sm text-text-secondary">
						Browse the <a href="/explore" class="text-brand hover:text-brand/80">registry</a> and open
						the extension you want. On the Versions tab, each release has a Download button and its SHA-256
						digest for verification.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>2</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Drop the JAR in and build</p>
					<p class="mt-1 text-sm text-text-secondary">
						Place the downloaded JAR in
						<code class="font-mono text-xs text-text">/opt/keycloak/providers/</code>
						and run
						<code class="font-mono text-xs text-text">kc.sh build</code>. That's it — no registry
						connection at runtime.
					</p>
				</div>
			</li>
		</ol>
	</section>

	<div class="border-t border-border"></div>

	<!-- Option B: Maven dependency -->
	<section class="space-y-5">
		<h2 class="text-base font-semibold text-text">Option B — Maven dependency</h2>
		<p class="text-sm text-text-secondary">
			For Maven build projects. Extensions published to Maven Central can be declared as
			dependencies in your <code class="font-mono text-xs text-text">pom.xml</code> and resolved at build
			time alongside your other dependencies.
		</p>
		<ol class="space-y-6">
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>1</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Copy the Maven snippet</p>
					<p class="mt-1 text-sm text-text-secondary">
						Open any extension in the <a href="/explore" class="text-brand hover:text-brand/80"
							>registry</a
						>. On the Overview tab, find the <strong>Maven install</strong> card and copy the
						<code class="font-mono text-xs text-text">&lt;dependency&gt;</code> snippet.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>2</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Add it to your pom.xml</p>
					<p class="mt-1 text-sm text-text-secondary">
						Paste the snippet into the
						<code class="font-mono text-xs text-text">&lt;dependencies&gt;</code> block of your
						<code class="font-mono text-xs text-text">pom.xml</code>. Maven resolves the JAR from
						Maven Central. Add one snippet per extension.
					</p>
				</div>
			</li>
		</ol>
	</section>

	<div class="border-t border-border"></div>

	<!-- Option C: YAML manifest -->
	<section class="space-y-5">
		<h2 class="text-base font-semibold text-text">Option C — YAML manifest + downloader script</h2>
		<p class="text-sm text-text-secondary">
			For containerised setups without a Maven build. Declare extensions in a
			<code class="font-mono text-xs text-text">keycloak-extensions.yaml</code> manifest and run the included
			downloader script to fetch all JARs from Maven Central in one step.
		</p>
		<ol class="space-y-6">
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>1</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Copy the YAML snippet</p>
					<p class="mt-1 text-sm text-text-secondary">
						Open any extension in the <a href="/explore" class="text-brand hover:text-brand/80"
							>registry</a
						>. On the Overview tab, find the <strong>YAML manifest</strong> card and copy the entry.
						Create a
						<code class="font-mono text-xs text-text">keycloak-extensions.yaml</code> file with an
						<code class="font-mono text-xs text-text">extensions:</code> header and add the entry. Repeat
						for each extension you need.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>2</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Run the downloader script</p>
					<p class="mt-1 text-sm text-text-secondary">
						Run <code class="font-mono text-xs text-text">scripts/download-extensions.sh</code> with
						<code class="font-mono text-xs text-text">--manifest</code> pointing to your YAML file
						and <code class="font-mono text-xs text-text">--target</code> pointing to your providers directory.
						The script uses a temporary Maven POM to resolve each extension and its transitive dependencies
						from Maven Central.
					</p>
				</div>
			</li>
		</ol>
	</section>

	<div class="border-t border-border"></div>

	<!-- Option D: Kubernetes init container -->
	<section class="space-y-5">
		<h2 class="text-base font-semibold text-text">Option D — Kubernetes init container</h2>
		<p class="text-sm text-text-secondary">
			For Kubernetes deployments. An init container runs the downloader script at pod startup,
			fetching all declared extensions from Maven Central into a shared
			<code class="font-mono text-xs text-text">providers</code> volume before Keycloak starts.
		</p>
		<ol class="space-y-6">
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>1</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Create your extensions ConfigMap</p>
					<p class="mt-1 text-sm text-text-secondary">
						Build a
						<code class="font-mono text-xs text-text">keycloak-extensions.yaml</code> file using the YAML
						manifest snippets from each extension's Overview tab, then create a Kubernetes ConfigMap from
						it.
					</p>
				</div>
			</li>
			<li class="flex gap-4">
				<span
					class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/20 font-mono text-xs text-brand"
					>2</span
				>
				<div class="min-w-0 flex-1">
					<p class="font-medium text-text">Add the init container to your pod spec</p>
					<p class="mt-1 text-sm text-text-secondary">
						Copy the <strong>Init container</strong> snippet from any extension's Overview tab and
						add it to your pod spec's
						<code class="font-mono text-xs text-text">initContainers</code> list. Mount the
						ConfigMap as the <code class="font-mono text-xs text-text">extensions-manifest</code>
						volume and a shared
						<code class="font-mono text-xs text-text">providers</code> emptyDir into both the init container
						and the Keycloak container.
					</p>
				</div>
			</li>
		</ol>
	</section>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs" class="text-sm text-brand no-underline hover:text-brand/80">← Introduction</a>
		<a href="/docs/configuration" class="text-sm text-brand no-underline hover:text-brand/80"
			>Maven install reference →</a
		>
	</div>
</div>
