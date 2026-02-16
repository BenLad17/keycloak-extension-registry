<script lang="ts">
	import { ExtensionCategoryLabel } from '$lib/common/extension-category';
	import type { Extension } from '$lib/server/db';

	export let data: { extension: Extension };
	const { extension } = data;
</script>

<svelte:head>
	<title>{extension.name} – Keycloak Extension Registry</title>
</svelte:head>

<section>

</section>