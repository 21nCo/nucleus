<script lang="ts">
  import { userPreferences } from "@nucleum/components/settings/userPreferences.store";
  import { onMount } from "svelte";
  import SizeFactorSelector from "@nucleum/components/settings/appearance/accessibility/sizeFactor/SizeFactorSelector.svelte";
  let { parentBackgroundIndex = 1 }: { parentBackgroundIndex?: number } =
    $props();
  let selectedFactor = $state(1);
  function onChange(event: any) {
    selectedFactor = Number(event.detail.factor);
    userPreferences.setAccessibilitySizingFactor(selectedFactor);
  }
  onMount(() => {
    selectedFactor =
      $userPreferences.accessibilitySizingFactor ?? selectedFactor;
  });
</script>

<div class="flex flex-col items-start gap-2">
  <div class="text-fgs2">Block sizing</div>
  <SizeFactorSelector
    onChange={onChange}
    {selectedFactor}
    {parentBackgroundIndex}
  />
</div>
