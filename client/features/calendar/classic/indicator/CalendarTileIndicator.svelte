<script lang="ts">
  import { Resource } from "@nucleum/datafn/resource.enum";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import type {
    DaySummary,
    ISessionThumb
  } from "@nucleum/features/focus/logs/log.type";
  import { CalendarTileIndicatorDisplayType } from "@nucleum/features/calendar/calendar.type";
  import { cn } from "@21n/utils/ui.utils";
  import YearTileIndicatorDot from "@nucleum/features/calendar/classic/indicator/YearTileIndicatorDot.svelte";
  import MonthTileIndicator from "@nucleum/features/calendar/classic/indicator/MonthTileIndicator.svelte";
  import { resolveIndicatorColor } from "@nucleum/features/calendar/classic/indicator/classicCalendarIndicator.utils";

  let {
    type = CalendarTileIndicatorDisplayType.DOTS,
    isActive = false,
    resolvedData = undefined
  }: {
    type?: CalendarTileIndicatorDisplayType;
    isActive?: boolean;
    resolvedData?: {
      tasks: ITaskThumb[];
      focusSessions: (ISessionThumb & {
        splits: { focus: number; brek: number };
      })[];
      nodes: any[];
      calendarNotes: any[];
      summary: DaySummary;
    };
  } = $props();

  const tasks = $derived(resolvedData?.tasks ?? []);
  const focusSessions = $derived(resolvedData?.focusSessions ?? []);
  const nodes = $derived(resolvedData?.nodes ?? []);
  const calendarNotes = $derived(resolvedData?.calendarNotes ?? []);
  const summary = $derived(resolvedData?.summary ?? { focus: 0, break: 0 });
</script>

{#if type === CalendarTileIndicatorDisplayType.METRICS}
  <div
    data-testid="calendar-tile-indicator-metrics"
    class={cn(
      "flex flex-col items-start justify-center text-b3 w-full h-full number-grid-size",
      {
        "text-fgs3": !isActive,
        "gap-1": isActive
      }
    )}
  >
    <MonthTileIndicator
      data={{
        tasks,
        focusSummary: summary,
        nodes,
        calendarNotes
      }}
      {isActive}
    />
  </div>
{:else if type === CalendarTileIndicatorDisplayType.DOTS}
  <div class="flex items-center justify-center gap-0.5">
    {#if tasks.length > 0}
      <YearTileIndicatorDot
        color={resolveIndicatorColor(Resource.task)}
        {isActive}
      />
    {/if}
    {#if focusSessions.length > 0}
      <YearTileIndicatorDot
        color={resolveIndicatorColor(Resource.session)}
        {isActive}
      />
    {/if}
    {#if nodes.length > 0 || calendarNotes.length > 0}
      <YearTileIndicatorDot
        color={resolveIndicatorColor(Resource.node)}
        {isActive}
        isMemory={true}
      />
    {/if}
  </div>
{/if}
