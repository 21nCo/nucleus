<script lang="ts">
  import { TimeScale } from "@21n/utils/time.type";
  import { popover } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/elements/direction.enum";
  import TimeScaleSelector from "@21n/elements/datetime/TimeScaleSelector.svelte";
  import {
    calculateTimeSpan,
    getDaysCount,
    scaleThresholds
  } from "@21n/elements/datetime/datetime.utils";

  let {
    start,
    end,
    scales = Object.values(TimeScale),
    spanScale = undefined,
    onChange = undefined
  }: {
    start: Date;
    end: Date;
    scales?: TimeScale[];
    spanScale?: TimeScale | undefined;
    onChange?: ((event: CustomEvent<TimeScale>) => void) | undefined;
  } = $props();
  let ref = $state<HTMLButtonElement | undefined>();
  const timeSpan = $derived(calculateTimeSpan(start, end, scales, spanScale));
  const totalDays = $derived(getDaysCount(start, end));
  const availableScales = $derived(
    scales.filter((scale: TimeScale) => totalDays >= scaleThresholds[scale])
  );

  function handleScaleSelect(scale: TimeScale) {
    spanScale = scale;
    const changeEvent = new CustomEvent<TimeScale>("change", {
      detail: scale
    });
    onChange?.(changeEvent);
    hidePopover();
  }

  function hidePopover() {
    ref?.dispatchEvent(new CustomEvent("hide"));
  }
</script>

<div class="flex flex-col gap-2">
  <div class="text-sm">
    Spanning {timeSpan.count}
    <button
      class="cursor-pointer border-b border-dotted border-fgs2 hover:border-fgs3"
      bind:this={ref}
      use:popover={{
        placement: Placement.BottomCenter,
        content: TimeScaleSelector,
        id: "time-span-scale-popover",
        componentProps: {
          scales: availableScales,
          onSelect: handleScaleSelect
        }
      }}
    >
      {timeSpan.scale.toLowerCase()}
    </button>
  </div>
</div>
