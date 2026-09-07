<script lang="ts">
  import { parseAndFormatDate } from "@21n/utils/time.utils";
  import { selectedTimePeriod } from "@nucleum/stores/app.store";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import Popover from "@21n/elements/popover/Popover.svelte";
  import AbsoluteTimeRangePopover from "@21n/elements/datetime/absolute/AbsoluteTimeRangePopover.svelte";
  import { cn } from "@21n/utils/ui.utils";
  let { size = Size.md }: any = $props();
  let ref = $state<any>();
</script>

<Popover bind:this={ref}>
  <button
    class={cn("flex items-center", {
      "gap-2": size === Size.lg,
      "gap-1": size === Size.md || size === Size.sm
    })}
  >
    <Icon icon="calendar" {size} />
    <span
      class={cn("text-fgs2 underline-dotted", {
        "text-h5 font-medium": size === Size.lg,
        "text-base": size === Size.md,
        "text-b2": size === Size.sm
      })}
    >
      {parseAndFormatDate($selectedTimePeriod)}
    </span>
  </button>
  {#snippet popover()}
    <AbsoluteTimeRangePopover
      isDatePickerMode={true}
      bind:selectedDate={$selectedTimePeriod}
      onChange={() => ref.toggle()}
    />
  {/snippet}
</Popover>
