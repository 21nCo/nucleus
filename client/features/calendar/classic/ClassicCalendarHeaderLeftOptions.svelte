<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { TimeScaleUnit } from "@21n/utils/time.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { OptionSelectorStyle } from "@21n/elements/select/select.type";
  import view from "@nucleum/stores/view.store";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@nucleum/client/config/product.type";
  import Button from "@21n/elements/button/Button.svelte";

  let {
    selectedView = $bindable(TimeScaleUnit.MONTH),
    isRefreshing = false,
    parentBgIndex = 2,
    onScaleSelection = undefined
  }: {
    selectedView?: TimeScaleUnit;
    isRefreshing?: boolean;
    parentBgIndex?: number;
    onScaleSelection?:
      | ((event: CustomEvent<TimeScaleUnit>) => void)
      | undefined;
  } = $props();
  const isDev = import.meta.env?.DEV;

  const monthOption = {
    label: "Month",
    icon: "text:M",
    value: TimeScaleUnit.MONTH
  };
  const yearOption = {
    label: "Year",
    icon: "text:Y",
    value: TimeScaleUnit.YEAR
  };
  const dayOption = {
    label: "Day",
    icon: "text:D",
    value: TimeScaleUnit.DAY
  };
  const weekOption = {
    label: "Week",
    icon: "text:W",
    value: TimeScaleUnit.WEEK
  };
  const heatmapOption = {
    label: "Heatmap",
    icon: "text:E",
    value: "heatmap"
  };
  const switchOptions =
    $appStore.product === Product.MEMOTRON
      ? [monthOption, yearOption]
      : [
          dayOption,
          isDev && weekOption,
          monthOption,
          yearOption,
          isDev && heatmapOption
        ].filter(Boolean);

  function handleScaleSelection(e: CustomEvent<TimeScaleUnit>) {
    if (!e.detail) return;
    selectedView = e.detail;
    uiState.setState(UIState.classicCalendarScale, selectedView, {
      scope: UIStateScope.DAP
    });
    onScaleSelection?.(e);
  }
</script>

<div class="flex items-center gap-2">
  <div>
    {#if $view.isConstrainedWidth}
      <DropDown
        items={switchOptions}
        value={selectedView}
        isDisableSearch={true}
        width="min-w-32"
        size={Size.sm}
        isEnforceWidth={true}
        onSelect={handleScaleSelection}
      />
    {:else}
      <OptionSelector
        options={switchOptions}
        selected={selectedView}
        size={Size.sm}
        {parentBgIndex}
        isExpandOnActiveForIcon={true}
        style={OptionSelectorStyle.ICON}
        onSelect={handleScaleSelection}
      />
    {/if}
  </div>
  {#if isDev}
    <Button icon="scope" tooltip="Calendar scope" />
  {/if}
</div>
