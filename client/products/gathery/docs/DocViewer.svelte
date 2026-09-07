<script lang="ts">
  import { page } from "$app/stores";
  import Node from "@nucleum/features/memory/node/Node.svelte";
  import { onMount } from "svelte";
  let { id: initialId = "" }: { id?: string } = $props();
  let id = $state(initialId);
  onMount(() => {
    const sub = page.subscribe((value) => {
      id = value.url.searchParams.get("doc") ?? "";
    });
    return () => {
      sub();
    };
  });
</script>

<div class="bg-bgs1 w-full h-full">
  <Node {id} />
</div>
