<svelte:options runes={true} />

<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Library from "@nucleum/application/library/Library.svelte";
  import { Product } from "@nucleum/client/config/product.type";
  import { resolveProductConfig } from "@nucleum/products/product.config";

  function resolveLibraryItems() {
    const items = resolveProductConfig(Product.NUCLEUM).resources?.browse ?? [
      Resource.collection
    ];
    return [...new Set(items)] as Resource[];
  }

  const libraryResources = resolveLibraryItems();
</script>

<Library resources={libraryResources} />
