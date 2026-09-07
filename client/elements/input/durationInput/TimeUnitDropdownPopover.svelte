<script lang="ts">
  import type { TimeUnit } from "@21n/utils/time.type";
  import TimeUnitItem from "@21n/elements/input/durationInput/TimeUnitItem.svelte";
  let {
    units,
    currentTimeUnit,
    selectedIndex,
    handleTimeUnitItemClick
  }: {
    units: TimeUnit[];
    currentTimeUnit: TimeUnit;
    selectedIndex: number;
    handleTimeUnitItemClick: (unit: TimeUnit) => void;
  } = $props();
</script>

<div class="bg-bgs1 w-40 rounded-md flex flex-col">
  {#if units.length > 1}
    {#each units as unit, index}
      <TimeUnitItem
        isActive={currentTimeUnit === unit || selectedIndex === index}
        {unit}
        onclick={() => handleTimeUnitItemClick(unit)}
      />
    {/each}
  {/if}
</div>
