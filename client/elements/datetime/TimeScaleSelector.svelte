<script lang="ts">
  import { TimeScale } from "@21n/utils/time.type";
  import { enumToString } from "@21n/shared-utils/text.utils";
  let { scales, onSelect, onHide }: any = $props();

  function handleSelect(scale: TimeScale) {
    onSelect?.(scale);
    const hideEvent = new CustomEvent("hide");
    onHide?.(hideEvent);
  }
</script>

<div class="bg-bgs1 shadow-lg rounded-md p-2 border w-36">
  {#each scales as scale}
    <button
      class="block w-full text-left px-2 py-1 hover:bg-bgs2 rounded-md"
      onclick={() => handleSelect(scale)}
    >
      {enumToString(scale)}
    </button>
  {/each}
</div>
