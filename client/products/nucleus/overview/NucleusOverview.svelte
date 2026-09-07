<svelte:options runes={true} />

<script lang="ts">
  import { onMount } from "svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import { OverviewPanel, Product } from "@nucleum/products/product.type";
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import AnalyticsV2 from "@nucleum/features/focus/analytics/AnalyticsV2.svelte";
  import MemotronOverview from "@nucleum/products/memotron/overview/MemotronOverview.svelte";
  import BoxSwitcher from "@21n/elements/switcher/BoxSwitcher.svelte";
  import { resolveProductConfig } from "@nucleum/products/product.config";

  let selectedPanel = $state<OverviewPanel>(
    resolveSavedState() ?? OverviewPanel.DASHBOARD
  );
  const items = [
    ...(resolveProductConfig(Product.NUCLEUM).overviewPanelSwitcherItems ?? []),
    {
      label: "Map",
      value: OverviewPanel.MAP,
      icon: "ph:map-pin-light"
    }
  ];

  function resolveSavedState() {
    const savedPanel = uiState.getState(UIState.nucleusOverviewPanel, {
      scope: UIStateScope.DEVICE
    });
    if (savedPanel && Object.values(OverviewPanel).includes(savedPanel)) {
      return savedPanel;
    }
  }

  onMount(() => {
    const uiStateUnsub = uiState.subscribe(() => {
      selectedPanel = resolveSavedState() ?? OverviewPanel.DASHBOARD;
    });

    return () => {
      uiStateUnsub();
    };
  });
</script>

<div class="w-full h-full flex flex-col">
  <div class="h-12 min-h-12 border-b border-brs3 pl-3">
    <BoxSwitcher options={items} bind:selected={selectedPanel} />
  </div>
  {#if selectedPanel === OverviewPanel.DASHBOARD}
    <div class="w-full h-full flex">
      <div class="w-80 h-full text-fgs3 text-b2 p-3 border-r border-brs3">
        <!-- TODO -->
        dashboard sidebar
      </div>
      <AnalyticsV2 />
    </div>
  {:else if selectedPanel === OverviewPanel.GRAPH || selectedPanel === OverviewPanel.MAP}
    <MemotronOverview />
  {:else}
    <ComingSoonView />
  {/if}
</div>
