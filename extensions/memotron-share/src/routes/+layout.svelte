<script lang="ts">
  import type { Snippet } from "svelte";
  import SheetBaseLayer from "@nucleum/extensions/SheetBaseLayer.svelte";
  import { Extension } from "@nucleum/client/config/product.type";
  let { children }: { children?: Snippet } = $props();
</script>

<SheetBaseLayer extension={Extension.MEMOTRON_SHARE}>
  {@render children?.()}
</SheetBaseLayer>
