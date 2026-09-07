<script lang="ts">
  import VerticalSwitcher from "@21n/elements/switcher/VerticalSwitcher.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import {
    UIState,
    UIStateScope
  } from "@nucleum/stores/uiState/uiState.type";
  import { Placement } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { VerticalSwitcherStyle } from "@21n/types/switcher.enum";
  import type { ISelectValue } from "@21n/types/select.type";
  import { OverviewPanel } from "@nucleum/products/product.type";
  import { Product } from "@nucleum/products/product.type";
  import { resolveProductConfig } from "@nucleum/products/product.config";

  const items =
    resolveProductConfig(Product.NUCLEUM).overviewPanelSwitcherItems ?? [];

  let selectedPanel: OverviewPanel = resolveSavedState() ?? OverviewPanel.FOCUS;

  function isOverviewPanel(val: ISelectValue): val is OverviewPanel {
    return Object.values(OverviewPanel).includes(val as OverviewPanel);
  }

  function resolveSavedState() {
    const savedPanel = uiState.getState(UIState.nucleusOverviewPanel, {
      scope: UIStateScope.DEVICE
    });
    if (savedPanel && Object.values(OverviewPanel).includes(savedPanel)) {
      return savedPanel;
    }
  }

  function onSwitch(val: ISelectValue) {
    if (!val || !isOverviewPanel(val)) return;
    appStore.toggleSearchParamRecordSpecific("overview", { tab: val });
    uiState.setState(UIState.nucleusOverviewPanel, val, {
      scope: UIStateScope.DEVICE
    });
  }
</script>

<div class="h-full">
  <VerticalSwitcher
    {items}
    selected={selectedPanel}
    itemProps={{ size: Size.sm, activeStatusPlacement: Placement.Right }}
    style={VerticalSwitcherStyle.GRADIENT}
    {onSwitch}
  />
</div>
