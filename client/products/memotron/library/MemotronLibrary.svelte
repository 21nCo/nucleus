<svelte:options runes={true} />

<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Library from "@nucleum/application/library/Library.svelte";

  const libraryResources = [
    Resource.node,
    Resource.collection,
    Resource.relation
  ];
</script>

<Library resources={libraryResources} />
