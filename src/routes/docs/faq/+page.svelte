<svelte:head>
	<title>FAQ - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">FAQ</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			Common questions about the registry and the Maven-native install patterns.
		</p>
	</div>

	<div class="space-y-4">
		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">How does the downloader script work?</p>
			<p class="text-sm text-text-secondary">
				The script reads your
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
					>keycloak-extensions.yaml</code
				>
				manifest, generates a temporary Maven POM listing all declared extensions as dependencies, and
				runs
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
					>mvn dependency:copy-dependencies</code
				>
				to resolve each extension and its transitive dependencies from Maven Central. The resolved JARs
				are copied to the directory specified by
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">--target</code>.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">
				What is <code class="font-mono text-xs">keycloak-extensions.yaml</code>?
			</p>
			<p class="text-sm text-text-secondary">
				A simple YAML file that lists the extensions you want to install as Maven coordinates (<code
					class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">groupId</code
				>,
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">artifactId</code>,
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">version</code>). Copy
				the YAML manifest snippet from any extension's Overview tab and add it under an
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">extensions:</code>
				header. One entry per extension. See the
				<a href="/docs/configuration" class="text-brand hover:text-brand/80"
					>Maven install reference</a
				> for the full format.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">What does the init container do?</p>
			<p class="text-sm text-text-secondary">
				The init container runs the downloader script at pod startup before Keycloak starts. It
				reads your
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
					>keycloak-extensions.yaml</code
				>
				ConfigMap (mounted at
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">/manifests</code>) and
				downloads all declared extensions from Maven Central into the shared
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">providers</code>
				emptyDir volume (mounted at
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
					>/opt/keycloak/providers</code
				>). Keycloak then starts with the providers already present in the volume.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Can I use multiple extensions?</p>
			<p class="text-sm text-text-secondary">
				Yes. Add one entry per extension to your
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text"
					>keycloak-extensions.yaml</code
				>
				file. The downloader script and init container handle all declared extensions in a single run.
				For the Maven dependency pattern, add one
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">&lt;dependency&gt;</code
				>
				block per extension in your
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">pom.xml</code>.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Why pin to an exact version?</p>
			<p class="text-sm text-text-secondary">
				Reproducibility. A deployment from three months ago should install the same JARs as one run
				today. Using an exact version ensures that your providers directory is deterministic across
				environments and over time, making rollbacks straightforward and audits reliable.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">
				What does <code class="font-mono text-xs">kc.sh build</code> do?
			</p>
			<p class="text-sm text-text-secondary">
				It augments Keycloak's classpath for the installed providers using Quarkus's build-time
				optimisation. The result is a faster, leaner startup. It is required if you start Keycloak
				with
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">--optimized</code>,
				which is the recommended production mode.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Which Keycloak version should I use?</p>
			<p class="text-sm text-text-secondary">
				You choose. Each extension page shows which Keycloak version it was built against, but
				extensions are often compatible with newer versions too. Check the extension's changelog and
				GitHub issues if you are unsure. The registry does not dictate your Keycloak base image.
			</p>
		</div>
	</div>

	<div class="flex items-center justify-start border-t border-border pt-6">
		<a href="/docs/configuration" class="text-sm text-brand no-underline hover:text-brand/80"
			>← Maven install reference</a
		>
	</div>
</div>
