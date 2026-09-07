<script lang="ts">
  import BirdCalendar from "@nucleum/features/calendar/birdViewV2/BirdCalendar.svelte";
  import ClassicCalendar from "@nucleum/features/calendar/classic/ClassicCalendar.svelte";
  import { CalendarLayout } from "@nucleum/features/calendar/calendar.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import view from "@nucleum/stores/view.store";
  import CalendarCw from "@nucleum/features/calendar/CalendarCW.svelte";
  let {
    panel = $bindable(resolvePanelSelection())
  }: { panel?: CalendarLayout } = $props();

  function resolvePanelSelection() {
    const layoutState = uiState.getState(UIState.calendarLayout, {
      scope: UIStateScope.DAP
    });
    if (layoutState === CalendarLayout.Bird) {
      return CalendarLayout.Classic;
    }
    return layoutState ?? CalendarLayout.Classic;
  }
</script>

{#if $view.isConstrainedWidth}
  <CalendarCw />
{:else if panel === CalendarLayout.Bird}
  <BirdCalendar bind:panel />
{:else if panel === CalendarLayout.Classic}
  <ClassicCalendar bind:panel />
{/if}
