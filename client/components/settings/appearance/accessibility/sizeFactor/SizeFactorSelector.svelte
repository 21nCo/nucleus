<script lang="ts">
  import SizeFactorItem from "@nucleum/components/settings/appearance/accessibility/sizeFactor/SizeFactorItem.svelte";
  let {
    selectedFactor = 1,
    parentBackgroundIndex = 1,
    onChange = undefined
  }: {
    selectedFactor?: number;
    parentBackgroundIndex?: number;
    onChange?:
      | ((event: CustomEvent<{ factor: number }>) => void)
      | undefined;
  } = $props();

  function emitChange(factor: number) {
    const changeEvent = new CustomEvent<{ factor: number }>("change", {
      detail: { factor }
    });
    onChange?.(changeEvent);
  }
</script>

<div class="flex gap-4 flex-wrap">
  {#each [0, 1, 2] as factor, index (index)}
    <SizeFactorItem
      {factor}
      {parentBackgroundIndex}
      isActive={selectedFactor === factor}
      onclick={() => emitChange(factor)}
    />
  {/each}
</div>
