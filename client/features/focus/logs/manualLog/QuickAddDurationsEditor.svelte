<script lang="ts">
  import FormControlLabelWrapper from "@21n/elements/text/formLabel/FormControlLabelWrapper.svelte";
  import DurationInput from "@21n/elements/input/durationInput/DurationInput.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant, ButtonStyle } from "@21n/elements/button/button.type";
  import { bg, cn } from "@21n/utils/ui.utils";
  import type { InputLabel } from "@21n/elements/input/input.type";
  import { Orientation } from "@21n/elements/direction.enum";
  import { rearrangeOnAxis } from "@nucleum/actions/rearrange.action";
  import { moveItemInArray } from "@21n/shared-utils/obj.utils";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { TimeFormat } from "@21n/utils/time.type";
  import { Size } from "@21n/elements/size.enum";

  let {
    values = $bindable<number[]>([]),
    label = {
      label: "Manual logs - Quick durations",
      tooltip: {
        body: "Quick duration options for manual time entries. Use these to quickly add durations to your manual logs."
      },
      orientation: Orientation.Vertical
    },
    placeholder = undefined,
    onChange = undefined
  }: {
    values?: number[];
    label?: InputLabel;
    placeholder?: string;
    onChange?:
      | ((event: CustomEvent<{ values: number[] | undefined }>) => void)
      | undefined;
  } = $props();
  let parentBgIndex: number = 1;

  let currentValue: number = 0;

  function emitChange(nextValues: number[] | undefined) {
    const changeEvent = new CustomEvent<{ values: number[] | undefined }>(
      "change",
      {
        detail: { values: nextValues }
      }
    );
    onChange?.(changeEvent);
  }

  function addValue() {
    if (currentValue > 0 && values) {
      const nextValue = currentValue / 60;
      if (values.some((value) => Math.abs(value - nextValue) < 0.0001)) {
        currentValue = 0;
        return;
      }
      const newValues = [...values, nextValue];
      values = newValues;
      currentValue = 0;
      emitChange(newValues);
    }
  }

  function removeValue(index: number) {
    if (values) {
      const newValues = values.filter((_, i) => i !== index);
      values = newValues;
      emitChange(newValues);
    }
  }

  function handleRearrange(index: number, displacement: number) {
    values = moveItemInArray(values ?? [], index, displacement > 0 ? 1 : -1);
  }

  function handleRearranged() {
    emitChange(values);
  }
</script>

<div class="p-3 border border-brs3 rounded-md">
  <FormControlLabelWrapper props={label}>
    <div class="flex flex-col gap-4 w-full">
      <div class="flex items-center gap-4">
        <div class="flex-1">
          <DurationInput
            bind:value={currentValue}
            {placeholder}
            isExpanded={true}
          />
        </div>
        <Button
          label="Add"
          icon="plus"
          type={ButtonVariant.PRIMARY}
          style={ButtonStyle.DEFAULT}
          onclick={addValue}
        />
      </div>
      <div class="flex flex-wrap gap-2">
        {#each values || [] as value, index (`${value}-${index}`)}
          <div
            class={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md",
              bg(parentBgIndex)
            )}
            use:rearrangeOnAxis={{
              enabled: true,
              onRearrange: (displacement) => {
                handleRearrange(index, displacement);
              },
              onRearranged: handleRearranged,
              threshold: 20
            }}
          >
            <span class="text-fgs2"
              >{formatSeconds(value * 60, TimeFormat.VERBOSE, {
                verboseTextSize: Size.md
              })}</span
            >
            <Button
              onclick={() => removeValue(index)}
              icon="cross"
              parentBgIndex={parentBgIndex + 1}
            />
          </div>
        {/each}
      </div>
    </div>
  </FormControlLabelWrapper>
</div>
