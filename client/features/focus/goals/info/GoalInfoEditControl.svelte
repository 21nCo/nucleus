<script lang="ts">
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import ColorPickerMini from "@21n/elements/colorPicker/ColorPickerMini.svelte";
  import type { IActiveObjectiveStore } from "@nucleum/features/focus/goals/goal.store";
  import { AlertType, type IInlineStatus } from "@21n/types/notification.type";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { resolveObjectiveSubTypesForSwitcher } from "@nucleum/features/focus/goals/goal.utils";
  import { InputStyle } from "@21n/types/input.type";
  import type { ObjectiveType } from "@nucleum/features/focus/goals/goal.type";

  let {
    objective,
    control,
    status = $bindable()
  }: {
    objective: IActiveObjectiveStore;
    control: "color" | "type";
    status?: IInlineStatus | undefined;
  } = $props();

  async function handleColorChange(e: number | string) {
    status = {
      message: "Updating color...",
      type: AlertType.PROGRESS
    };
    try {
      await objective.modify({
        color: +e
      });
    } catch {
      status = {
        type: AlertType.ERROR,
        message: "Failed to update objective color"
      };
      return;
    }
    status = {
      message: "Color updated",
      type: AlertType.SUCCESS
    };
  }

  function resolveLabel(control: "color" | "type") {
    if (control === "color") {
      return "Color";
    }
    return "Type";
  }

  async function handleTypeChange(e: CustomEvent<ObjectiveType>) {
    status = {
      message: "Updating type...",
      type: AlertType.PROGRESS
    };
    try {
      await objective.modify({
        type: e.detail
      });
    } catch {
      status = {
        type: AlertType.ERROR,
        message: "Failed to update objective type"
      };
      return;
    }
    status = {
      message: "Type updated",
      type: AlertType.SUCCESS
    };
  }
</script>

{#if (control === "color" && !isValidArrayWithData($objective.parent)) || control !== "color"}
  <div
    class="flex flex-col gap-2 border border-brs3 rounded-md px-2 py-1 h-full"
  >
    <span class="text-left text-b2 text-fgs3">{resolveLabel(control)}</span>
    {#if control === "color"}
      <ColorPickerMini
        hue={$objective.color}
        width="w-full"
        onDebouncedChangeCallback={handleColorChange}
      />
    {:else if control === "type"}
      <div class="my-auto">
        <DropDown
          items={resolveObjectiveSubTypesForSwitcher()}
          value={$objective.type}
          isDisableSearch={true}
          style={InputStyle.PLAIN}
          onSelect={handleTypeChange}
        />
      </div>
    {/if}
  </div>
{/if}
