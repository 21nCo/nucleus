<script lang="ts">
  import { TimeScaleUnit } from "@21n/types/time.type";
  import { CalendarColumnPanel } from "@nucleum/features/calendar/calendar.type";
  import CalendarHistoryPanel from "@nucleum/features/calendar/column/CalendarHistoryPanel.svelte";
  import CalendarNotesPanel from "@nucleum/features/calendar/column/CalendarNotesPanel.svelte";
  import CalendarOverviewPanel from "@nucleum/features/calendar/column/overview/CalendarOverviewPanel.svelte";
  import { cn } from "@21n/utils/ui.utils";

  let {
    selectedPanel,
    date,
    scale,
    isRewind = false,
    mdId
  }: {
    selectedPanel: CalendarColumnPanel;
    date: Date;
    scale: TimeScaleUnit;
    isRewind?: boolean;
    mdId: string;
  } = $props();
</script>

<div
  class={cn("flex-grow", {
    "p-3": selectedPanel !== CalendarColumnPanel.Notes,
    "p-2": selectedPanel === CalendarColumnPanel.Notes
  })}
>
  {#if selectedPanel === CalendarColumnPanel.Activity}
    <CalendarHistoryPanel {date} isInline={true} />
  {:else if selectedPanel === CalendarColumnPanel.Overview}
    <CalendarOverviewPanel {date} {isRewind} />
  {:else if selectedPanel === CalendarColumnPanel.Notes}
    <CalendarNotesPanel {date} {scale} {mdId} />
  {/if}
</div>
