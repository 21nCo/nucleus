<script lang="ts">
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { OptionSelectorStyle } from "@21n/types/select.type";
  import { Size } from "@21n/types/size.enum";
  import { TimeScaleUnit } from "@21n/types/time.type";
  import Birdview from "@nucleum/features/calendar/birdView/Birdview.svelte";
  import {
    CalendarColumnLayout,
    CalendarColumnPanel,
    CalendarLayout
  } from "@nucleum/features/calendar/calendar.type";
  import CalendarLayoutView from "@nucleum/features/calendar/CalendarLayout.svelte";
  import CalendarHeader from "@nucleum/features/calendar/classic/CalendarHeader.svelte";
  import CalendarColumnPanelSelector from "../column/CalendarColumnPanelSelector.svelte";
  import { resolveCalendarColumnPanels } from "../calendar.utils";
  import { appStore } from "@nucleum/stores/app.store";

  let {
    panel = $bindable(CalendarLayout.Bird)
  }: {
    panel?: CalendarLayout;
  } = $props();
  let scale = $state(TimeScaleUnit.DAY);
  let selectedDate = $state(new Date());
  const isDev = import.meta.env?.DEV;
  let selectedPanel = $state(CalendarColumnPanel.Timeline);

  const switchOptions = [
    {
      label: "Parts",
      icon: "text:P",
      value: TimeScaleUnit.PART
    },
    {
      label: "Days",
      icon: "text:D",
      value: TimeScaleUnit.DAY
    },
    {
      label: "Weeks",
      icon: "text:W",
      value: TimeScaleUnit.WEEK
    },
    {
      label: "Months",
      icon: "text:M",
      value: TimeScaleUnit.MONTH
    },
    {
      label: "Years",
      icon: "text:Y",
      value: TimeScaleUnit.YEAR
    }
  ];
</script>

<CalendarLayoutView bind:panel>
  {#snippet headerLeftOptions()}
    {#if isDev}
      <OptionSelector
        options={switchOptions}
        size={Size.sm}
        bind:selected={scale}
        parentBgIndex={2}
        isExpandOnActiveForIcon={true}
        style={OptionSelectorStyle.ICON}
      />
    {/if}
  {/snippet}
  {#snippet header()}
    <CalendarHeader
      bind:selectedDate
      bind:selectedView={scale}
      onDateChange={() => {}}
      onGoToPrevious={() => {}}
      onGoToNext={() => {}}
    />
  {/snippet}
  {#snippet headerRightOptions()}
    <!-- This panel switcher won't be necessary as the column will have the necessary information for all aspects and upon click - expands to show content similar to classic mode with panels inside it -->
    <!-- <CalendarColumnPanelSelector
      panels={resolveCalendarColumnPanels(
        $appStore.product,
        CalendarColumnLayout.TABS
      )}
      isBoxed={false}
      {selectedPanel}
    /> -->
  {/snippet}
  <div class="w-full h-full max-h-full">
    <Birdview mode={scale} />
  </div>
</CalendarLayoutView>
