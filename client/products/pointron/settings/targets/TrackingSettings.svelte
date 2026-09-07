<script lang="ts">
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import MultiselectDropdown from "@21n/elements/dropdown/MultiselectDropdown.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { TimeScale } from "@21n/types/time.type";
  import TargetInput from "@nucleum/products/pointron/settings/targets/TargetInput.svelte";
  import { onMount } from "svelte";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { InputStyle } from "@21n/types/input.type";
  import { Orientation } from "@21n/types/direction.enum";
  import type { ISelectValue } from "@21n/types/select.type";
  let timescaleOptions = $userPreferences.timeScales
    ? $userPreferences.timeScales.map((x) => {
        return { label: properCase(x), value: x };
      })
    : Object.values(TimeScale).map((key) => {
        return {
          label: properCase(key),
          value: key
        };
      });
  let horizonsWithTarget = $state<TimeScale[]>([]);

  onMount(() => {
    const filteredHorizons =
      $pointronPreferences.horizonsWithTarget?.filter((x) =>
        $userPreferences.timeScales?.some((y) => y == x)
      ) ?? [];
    horizonsWithTarget = filteredHorizons;
    pointronPreferences.modify({ horizonsWithTarget: filteredHorizons });
  });

  function onHorizonsSelect(event: CustomEvent<ISelectValue[]>) {
    horizonsWithTarget = event.detail as TimeScale[];
    pointronPreferences.modify({ horizonsWithTarget });
  }
</script>

<div class="flex flex-col gap-4 w-full h-full">
  <MultiselectDropdown
    label={{
      label: "Enable target for these time scales",
      orientation: Orientation.Vertical
    }}
    options={timescaleOptions}
    selected={horizonsWithTarget}
    onSelect={onHorizonsSelect}
    style={InputStyle.BORDERED}
  />

  {#if horizonsWithTarget.length > 0}
    {#each horizonsWithTarget as item}
      <TargetInput {item} />
    {/each}
  {/if}
</div>
