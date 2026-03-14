<svelte:head>
	<title>FAQ - Keycloak Extension Registry Docs</title>
</svelte:head>

<div class="space-y-10">
	<div>
		<h1 class="mb-3 text-2xl font-semibold tracking-tight">FAQ</h1>
		<p class="text-base leading-relaxed text-text-secondary">
			Common questions about the registry and the Dockerfile pattern.
		</p>
	</div>

	<div class="space-y-4">
		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Where does the provider image come from?</p>
			<p class="text-sm text-text-secondary">
				When the registry syncs a new extension version it automatically builds a minimal OCI image
				containing only the JAR and publishes it. This happens within minutes of a new release being
				detected. The image is public and free to pull.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Can I use multiple extensions?</p>
			<p class="text-sm text-text-secondary">
				Yes. Add one
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">COPY --from=</code>
				line per extension before the
				<code class="rounded bg-bg px-1 py-0.5 font-mono text-xs text-text">RUN kc.sh build</code>
				step. The pattern is identical for any number of extensions.
			</p>
		</div>

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Why pin to an exact version instead of "latest"?</p>
			<p class="text-sm text-text-secondary">
				Reproducibility. A Docker build from three months ago should produce the same image as one
				run today. A "latest" shorthand would silently update extensions between builds, making
				rollbacks harder and breaking the auditability of what is in each image.
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

		<div class="rounded-xl border border-border bg-surface/40 px-5 py-4">
			<p class="mb-1.5 font-medium text-text">Does anything run at container startup?</p>
			<p class="text-sm text-text-secondary">
				No. Extensions are baked into the image at build time. Your running container has no
				dependency on the registry or any external service.
			</p>
		</div>
	</div>

	<div class="flex items-center justify-start border-t border-border pt-6">
		<a href="/docs/configuration" class="text-sm text-brand no-underline hover:text-brand/80"
			>← Dockerfile reference</a
		>
	</div>
</div>
