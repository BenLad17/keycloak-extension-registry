<script lang="ts">
	import CodeBlock from '$lib/components/CodeBlock.svelte';

	const yamlExample = `extensions:
  - groupId: com.github.wadahiro.keycloak
    artifactId: keycloak-home-idp-discovery
    version: 26.1.0
  - groupId: io.phasetwo.keycloak
    artifactId: keycloak-magic-link
    version: 2.0.0`;

	const downloaderExample = `scripts/download-extensions.sh \\
  --manifest keycloak-extensions.yaml \\
  --target /opt/keycloak/providers`;

	const initContainerExample = `initContainers:
  - name: install-extensions
    image: ghcr.io/benlad17/keycloak-extension-registry/downloader:latest
    args:
      - "--manifest"
      - "/manifests/keycloak-extensions.yaml"
      - "--target"
      - "/opt/keycloak/providers"
    volumeMounts:
      - name: providers
        mountPath: /opt/keycloak/providers
      - name: extensions-manifest
        mountPath: /manifests

# In your pod's volumes list:
volumes:
  - name: providers
    emptyDir: {}
  - name: extensions-manifest
    configMap:
      name: keycloak-extensions-config

# Mount the providers volume in your Keycloak container:
# volumeMounts:
#   - name: providers
#     mountPath: /opt/keycloak/providers`;
</script>

<svelte:head>
	<title>Maven install reference - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-12">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">Maven install reference</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			Reference for the three Maven-native install patterns: YAML manifest format, downloader
			script, and Kubernetes init container.
		</p>
	</div>

	<!-- keycloak-extensions.yaml format -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">
			<code class="font-mono">keycloak-extensions.yaml</code> format
		</h2>
		<p class="mb-4 text-sm text-text-secondary">
			The manifest file declares the extensions to install. Each entry specifies a Maven coordinate.
			Copy individual entries from the <strong>YAML manifest</strong> card on each extension's Overview
			tab.
		</p>
		<CodeBlock code={yamlExample} lang="yaml" />
		<div class="mt-4 space-y-2 text-sm text-text-secondary">
			<p>
				<strong class="text-text">groupId</strong> — Maven group ID (e.g.
				<code class="font-mono text-xs text-text">com.github.wadahiro.keycloak</code>).
			</p>
			<p>
				<strong class="text-text">artifactId</strong> — Maven artifact ID (e.g.
				<code class="font-mono text-xs text-text">keycloak-home-idp-discovery</code>).
			</p>
			<p>
				<strong class="text-text">version</strong> — Exact version string to pin. Pin to exact versions
				for reproducible builds.
			</p>
		</div>
	</section>

	<!-- Downloader script -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">Downloader script</h2>
		<p class="mb-4 text-sm text-text-secondary">
			<code class="font-mono text-xs text-text">scripts/download-extensions.sh</code> reads your YAML
			manifest and fetches each extension — along with its transitive dependencies — from Maven Central
			into a target directory.
		</p>
		<CodeBlock code={downloaderExample} lang="bash" />
		<div class="mt-4 space-y-2 text-sm text-text-secondary">
			<p>
				<strong class="text-text">--manifest</strong> — Path to your
				<code class="font-mono text-xs text-text">keycloak-extensions.yaml</code> file.
			</p>
			<p>
				<strong class="text-text">--target</strong> — Directory where JARs will be downloaded. Use
				<code class="font-mono text-xs text-text">/opt/keycloak/providers</code> for Keycloak's providers
				directory.
			</p>
		</div>
		<p class="mt-4 text-sm text-text-secondary">
			The script generates a temporary Maven POM, invokes
			<code class="font-mono text-xs text-text">mvn dependency:copy-dependencies</code>, and copies
			the resolved JARs to the target directory. Maven must be available on the PATH.
		</p>
	</section>

	<!-- Init container pattern -->
	<section>
		<h2 class="mb-3 text-xl font-semibold text-text">Kubernetes init container pattern</h2>
		<p class="mb-4 text-sm text-text-secondary">
			Add the init container to your Keycloak pod spec. It runs the downloader script at pod
			startup, fetching extensions from Maven Central into a shared
			<code class="font-mono text-xs text-text">providers</code> emptyDir volume. The init container must
			complete before Keycloak starts.
		</p>
		<CodeBlock code={initContainerExample} lang="yaml" />
		<div class="mt-4 space-y-2 text-sm text-text-secondary">
			<p>Two volumes are required:</p>
			<ul class="ml-4 list-disc space-y-1">
				<li>
					<code class="font-mono text-xs text-text">providers</code> (emptyDir) — shared between the
					init container and the Keycloak container; mounted at
					<code class="font-mono text-xs text-text">/opt/keycloak/providers</code> in both.
				</li>
				<li>
					<code class="font-mono text-xs text-text">extensions-manifest</code> (ConfigMap) — your
					<code class="font-mono text-xs text-text">keycloak-extensions.yaml</code> mounted at
					<code class="font-mono text-xs text-text">/manifests</code> in the init container.
				</li>
			</ul>
		</div>
	</section>

	<div class="flex items-center justify-between border-t border-border pt-6">
		<a href="/docs/quickstart" class="text-sm text-brand no-underline hover:text-brand/80"
			>← Quick start</a
		>
		<a href="/docs/faq" class="text-sm text-brand no-underline hover:text-brand/80">FAQ →</a>
	</div>
</div>
