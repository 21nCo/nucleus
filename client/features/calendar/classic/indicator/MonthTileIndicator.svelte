<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import Icon from "@21n/elements/Icon.svelte";
  import type { DaySummary } from "@nucleum/features/focus/logs/log.type";
  import { Size } from "@21n/elements/size.enum";
  import { TimeFormat } from "@21n/utils/time.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import { cn } from "@21n/utils/ui.utils";
  import TinyPieChart from "@nucleum/features/calendar/classic/indicator/TinyPieChart.svelte";
  let {
    data,
    isActive = false
  }: {
    data: {
      tasks: ITaskThumb[];
      focusSummary: DaySummary;
      nodes: any;
      calendarNotes: any;
    };
    isActive?: boolean;
  } = $props();
</script>

<div
  class={cn("grid grid-rows-[1fr_auto] text-b3 gap-1 w-full h-full", {
    "text-aps1": isActive,
    "text-fgs3 group-hover:text-fgs2": !isActive
  })}
>
  {#if data.tasks.length > 0 || data.focusSummary.focus > 0}
    <div class="flex flex-col items-start">
      {#if data.tasks.length > 0}
        {@const completedCount = data.tasks.filter(
          (task) => task.isChecked
        ).length}
        {@const pendingCount = data.tasks.length - completedCount}
        <div
          data-testid="calendar-tile-indicator-task"
          class="flex items-center gap-2"
          use:tooltip={{
            text: `${completedCount} completed out of ${data.tasks.length} task${data.tasks.length > 1 ? "s" : ""}`
          }}
        >
          <TinyPieChart
            primary={completedCount}
            secondary={pendingCount}
            primaryColor={isActive ? "stroke-aps1" : "stroke-fgs3"}
            secondaryColor={isActive ? "stroke-aps1/90" : "stroke-fgs4"}
            size={12}
            strokeWidth={2}
          />
          <div class="flex items-center gap-0.5">
            <span>{completedCount}</span>/
            <span>{data.tasks.length}</span>
            &nbsp;task{data.tasks.length > 1 ? "s" : ""}
          </div>
        </div>
      {/if}
      {#if data.focusSummary.focus > 0}
        {@const focusTime = formatSeconds(
          data.focusSummary.focus,
          TimeFormat.VERBOSE,
          {
            verboseTextSize: Size.md
          }
        )}
        {@const breakTime = formatSeconds(
          data.focusSummary.break,
          TimeFormat.VERBOSE,
          {
            verboseTextSize: Size.md
          }
        )}
        {@const focusTimeShortText = formatSeconds(
          data.focusSummary.focus,
          TimeFormat.DECIMALS
        )}
        {@const breakTimeShortText = formatSeconds(
          data.focusSummary.break,
          TimeFormat.DECIMALS
        )}
        <div
          data-testid="calendar-tile-indicator-session"
          class="flex items-center gap-2"
          use:tooltip={{
            text: `Focus: ${focusTime} | Break: ${breakTime}`
          }}
        >
          <TinyPieChart
            primary={data.focusSummary.focus}
            secondary={data.focusSummary.break}
            primaryColor={isActive ? "stroke-aps1" : "stroke-fgs3"}
            secondaryColor={isActive ? "stroke-aps1/90" : "stroke-fgs4"}
            size={12}
            strokeWidth={2}
          />
          <div class="flex items-center gap-0.5">
            F:
            <span
              >{focusTimeShortText}
              {#if data.focusSummary.break > 0}
                + {breakTimeShortText}
              {/if}
            </span>
          </div>
        </div>
      {/if}
    </div>
  {:else}
    <span />
  {/if}

  {#if ("nodes" in data && data.nodes.length > 0) || ("calendarNotes" in data && data.calendarNotes.length > 0)}
    <div class="flex items-center gap-1">
      {#if data.nodes.length > 0}
        <div
          data-testid="calendar-tile-indicator-node"
          class={cn("flex items-center gap-0.5 border rounded-md px-1 h-5", {
            "border-brs2": !isActive,
            "border-aps2": isActive
          })}
          use:tooltip={{
            text: `${data.nodes.length} new node${data.nodes.length > 1 ? "s" : ""}`
          }}
        >
          <Icon
            icon="hexagon"
            class={isActive ? "text-aps1" : "text-fgs2"}
            isFilled={isActive}
            size={Size.xs}
          />
          <span>{data.nodes.length}</span>
        </div>
      {/if}
      {#if data.calendarNotes.length > 0}
        <div
          data-testid="calendar-tile-indicator-notes"
          class={cn("flex items-center gap-0.5 border rounded-md px-1 h-5", {
            "border-brs2": !isActive,
            "border-aps2": isActive
          })}
          use:tooltip={{
            text: "Day notes"
          }}
        >
          <Icon
            icon="note"
            class={isActive ? "text-aps1" : "text-fgs2"}
            isFilled={isActive}
            size={Size.xs}
          />
        </div>
      {/if}
    </div>
  {/if}
</div>
