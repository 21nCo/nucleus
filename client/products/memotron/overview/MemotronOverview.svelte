<script lang="ts">
  import { onMount } from "svelte";
  import GlobalGraph from "@nucleum/features/memory/graph/GlobalGraph.svelte";
  import MemotronMapOverview from "@nucleum/products/memotron/overview/MemotronMapOverview.svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import {
    UIState,
    UIStateScope
  } from "@nucleum/stores/uiState/uiState.type";
  import MemotronDefaultOverview from "@nucleum/products/memotron/overview/MemotronDefaultOverview.svelte";
  import { MemotronOverviewPanel } from "@nucleum/products/memotron/overview/overview.type";

  let selectedPanel: MemotronOverviewPanel =
    resolveSavedState() ?? MemotronOverviewPanel.GRAPH;

  function resolveSavedState() {
    const savedPanel = uiState.getState(UIState.memotronOverviewPanel, {
      scope: UIStateScope.DEVICE
    });
    if (
      savedPanel &&
      Object.values(MemotronOverviewPanel).includes(savedPanel)
    ) {
      return savedPanel;
    }
  }

  onMount(() => {
    const uiStateUnsub = uiState.subscribe(() => {
      selectedPanel = resolveSavedState() ?? MemotronOverviewPanel.GRAPH;
    });

    return () => {
      uiStateUnsub();
    };
  });
</script>

{#if selectedPanel === MemotronOverviewPanel.GRAPH}
  <GlobalGraph />
{:else if selectedPanel === MemotronOverviewPanel.MAP}
  <MemotronMapOverview />
{/if}
