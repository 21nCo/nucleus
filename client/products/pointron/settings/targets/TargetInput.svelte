<script lang="ts">
  import { pointronPreferences } from "@nucleum/products/pointron/pointron.store";
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import type { TimeScale } from "@21n/types/time.type";
  import { getCorrespoingHorizonFrequencyLabel } from "@21n/utils/time.utils";
  import { onMount } from "svelte";

  let { item }: { item: TimeScale } = $props();
  let value = $state(0);

  function onInput(event: CustomEvent<{ value: number }>) {
    let targets = ($pointronPreferences.horizonTargets ?? []).filter(
      (x) => x.scale != item
    );
    targets.push({ scale: item, target: +event.detail.value });
    pointronPreferences.modify({ horizonTargets: targets });
  }
  onMount(() => {
    value =
      $pointronPreferences.horizonTargets?.find((x) => x.scale == item)
        ?.target ?? 0;
  });
</script>

<DurationInput
  bind:value
  label={{ label: getCorrespoingHorizonFrequencyLabel(item) + " focus target" }}
  onChange={onInput}
/>
