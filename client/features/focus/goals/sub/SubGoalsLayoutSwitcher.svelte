<script lang="ts">
  import {
    SubObjectivesLayout,
    type SubObjectivesLayoutValue
  } from "@nucleum/features/focus/goals/goal.type";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";

  let {
    layout = $bindable(),
    onSelect = undefined
  }: {
    layout?: SubObjectivesLayoutValue | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
</script>

<div class="text-fgs3">
  <DropDown
    bind:value={layout}
    popoverWidth="w-40"
    style={InputStyle.PLAIN}
    isDisableSearch={true}
    items={[
      {
        value: SubObjectivesLayout.DEFAULT,
        icon: "circle-dashed",
        label: "Default"
      },
      {
        value: SubObjectivesLayout.STEPS,
        icon: "ph:steps-light",
        label: "Steps"
      }
    ]}
    {onSelect}
  />
</div>
