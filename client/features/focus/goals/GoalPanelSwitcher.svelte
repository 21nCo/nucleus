<script lang="ts">
  import ResourcePanelSwitcher from "@nucleum/components/resource/ResourcePanelSwitcher.svelte";
  import {
    resolveObjectiveContextMenu,
    type IActiveObjectiveStore
  } from "@nucleum/features/focus/goals/goal.store";
  import { derived } from "svelte/store";
  import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import {
    type IResourcePageWithPanels,
    ResourceAccessPoint
  } from "@nucleum/datafn/resource.type";
  import type { ResourcePanelType } from "@nucleum/components/resource/resourcePanel.type";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";

  let {
    objective,
    panels,
    isConstrainedWidth = false,
    isThreeColumned = false
  }: {
    objective: IActiveObjectiveStore;
    panels: IToggleItem[];
    isConstrainedWidth?: boolean;
    isThreeColumned?: boolean;
  } = $props();

  const adaptedStore = derived(
    objective,
    ($objective): IResourcePageWithPanels => ({
      id: $objective.id,
      panel: $objective.panel,
      defaultPanel: $objective.defaultPanel ?? $objective.panel,
      isInFocusMode: $objective.isInFocusMode,
      isInEditMode: $objective.isInEditMode,
      switchPanel: (panel?: string) => {
        if (!panel) return;
        uiState.setState(UIState.objectivePanelSelection, panel, {
          scope: UIStateScope.DEVICE,
          subVariables: [
            isConstrainedWidth.toString(),
            isThreeColumned.toString()
          ]
        });
        objective.switchPanel(panel);
      },
      closeEditMode: () => objective.toggleEditMode(false)
    })
  );

  function resolveObjectiveThumb() {
    return $objective as unknown as IObjectiveThumb;
  }
</script>

<ResourcePanelSwitcher
  resourceStore={adaptedStore}
  {panels}
  accessMode={$objective.accessMode}
  {isConstrainedWidth}
  contextMenuResolver={() =>
    resolveObjectiveContextMenu(
      resolveObjectiveThumb(),
      ResourceAccessPoint.SELF
    )}
/>
