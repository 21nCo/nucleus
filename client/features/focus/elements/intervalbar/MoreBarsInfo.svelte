<script lang="ts">
  import view from "@nucleum/stores/view.store";
  let { length = 0 }: { length?: number } = $props();
</script>

<span
  class="flex text-b4 mo:text-b5 text-fgs3 w-1/10 whitespace-nowrap min-w-fit px-1 py-0.5 border border-brs2 rounded-md mb-1"
>
  +{length}
  {#if !$view.isPortrait}
    intervals
  {/if}
</span>
