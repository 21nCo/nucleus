<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import { InputStyle, type InputLabel } from "@21n/elements/input/input.type";
  import FormElement from "@21n/elements/FormElement.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { popover } from "@nucleum/actions/popover.action";
  import AbsoluteTimeRangePopoverV2 from "@21n/elements/datetime/absolute/AbsoluteTimeRangePopoverV2.svelte";
  let {
    parentBackgroundIndex = 1,
    initialStartDate = null,
    initialEndDate = null,
    style = InputStyle.BORDERED,
    label = undefined,
    onChange
  }: {
    parentBackgroundIndex?: number;
    initialStartDate?: Date | null;
    initialEndDate?: Date | null;
    style?: InputStyle;
    label?: InputLabel | undefined;
    onChange?: ((val: { start: string; end: string }) => void) | undefined;
  } = $props();
  let isPopoverVisible = $state(false);
  void parentBackgroundIndex;

  function isValidDate(date: Date | null): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  function handleRangeChange(val: { start: string; end: string }) {
    onChange?.(val);
  }
</script>

<FormElement {style} {label} isFocused={isPopoverVisible}>
  <div
    class={cn("flex items-center gap-2 p-2 w-full", {})}
    use:popover={{
      content: AbsoluteTimeRangePopoverV2,
      id: "time-range-picker-popover",
      isRenderAsModalForCW: true,
      componentProps: {
        initialStartDate,
        initialEndDate,
        onRangeChange: handleRangeChange
      }
    }}
    onchange={(e) => {
      isPopoverVisible = e.detail?.open;
    }}
  >
    <Icon icon="calendar" size={Size.md} />
    {#if isValidDate(initialStartDate) && isValidDate(initialEndDate)}
      <span class="text-fgs2 text-base">
        {parseAndFormatDate(initialStartDate)} - {parseAndFormatDate(
          initialEndDate
        )}
      </span>
    {:else}
      <span class="text-fgs2 text-b2">Select start and end date</span>
    {/if}
  </div>
</FormElement>
