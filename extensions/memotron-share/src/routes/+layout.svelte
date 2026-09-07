<script lang="ts">
  import type { Snippet } from "svelte";
  import SheetBaseLayer from "@nucleum/extensions/SheetBaseLayer.svelte";
  import { Extension } from "@21n/types/product.type";
  let { children }: { children?: Snippet } = $props();
</script>

<SheetBaseLayer extension={Extension.MEMOTRON_SHARE}>
  {@render children?.()}
</SheetBaseLayer>
