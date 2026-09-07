<script lang="ts">
  import type { IActiveObjectiveStore } from "@nucleum/features/focus/goals/goal.store";
  import { TimeScale } from "@21n/types/time.type";
  import { InputStyle } from "@21n/types/input.type";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import TimelineCardAxis from "@nucleum/features/focus/goals/info/TimelineCardAxis.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import TimeSpan from "@21n/elements/datetime/TimeSpan.svelte";
  import {
    activeScales,
    resolveDefaultSpanScale
  } from "@21n/elements/datetime/datetime.utils";

  let { objective }: { objective: IActiveObjectiveStore } = $props();

  const startDate = $derived(
    $objective.startDate ? new Date($objective.startDate) : new Date()
  );
  const endDate = $derived($objective.endDate ? new Date($objective.endDate) : new Date());

  $effect(() => {
    if (!$objective.spanScale && $objective.startDate && $objective.endDate) {
    const spanScale = resolveDefaultSpanScale(startDate, endDate, activeScales);
    if (spanScale) {
      objective.modify({
        spanScale
      });
    }
    }
  });

  function handleStartDateChange(e: CustomEvent) {
    $objective.startDate = e.detail;
    objective.modify({
      startDate: e.detail
    });
  }

  function handleEndDateChange(e: CustomEvent) {
    $objective.endDate = e.detail;
    objective.modify({
      endDate: e.detail
    });
  }

  function handleSpanChange(e: CustomEvent<TimeScale>) {
    objective.modify({
      spanScale: e.detail
    });
  }
</script>

<div
  class="flex flex-col gap-4 rounded-md border border-brs3 px-3 py-4 userdata"
>
  <div class="flex gap-2 justify-between w-full text-fgs3 text-b2">
    <DatePicker
      date={startDate}
      style={InputStyle.PLAIN}
      variant="inline"
      onChange={handleStartDateChange}
    />
    <DatePicker
      date={endDate}
      style={InputStyle.PLAIN}
      variant="inline"
      onChange={handleEndDateChange}
    />
  </div>
  <Divider />
  <div class="flex flex-col gap-2">
    <div class="relative px-6">
      <TimelineCardAxis {startDate} {endDate} spanScale={$objective.spanScale} />
    </div>
  </div>

  {#if $objective.startDate && $objective.endDate}
    <div class="flex text-b3 text-fgs3 w-full justify-center">
      <TimeSpan
        scales={[
          TimeScale.DAYS,
          TimeScale.WEEKS,
          TimeScale.MONTHS,
          TimeScale.YEARS
        ]}
        start={new Date($objective.startDate)}
        end={new Date($objective.endDate)}
        spanScale={$objective.spanScale}
        onChange={handleSpanChange}
      />
    </div>
  {/if}
</div>
