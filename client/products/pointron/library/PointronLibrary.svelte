<svelte:options runes={true} />

<script lang="ts">
  import Library from "@nucleum/application/library/Library.svelte";
  import { Product } from "@nucleum/client/config/product.type";
  import { resolveProductConfig } from "@nucleum/products/product.config";

  const libraryResources = resolveProductConfig(Product.POINTRON).resources
    .browse;
</script>

<Library resources={libraryResources} />
