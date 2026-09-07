<script lang="ts">
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import {
    UIState,
    UIStateScope
  } from "@nucleum/stores/uiState/uiState.type";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import { Size } from "@21n/types/size.enum";
  import { InputStyle } from "@21n/types/input.type";
  import EditCaptureShortcuts from "@nucleum/features/memory/capture/EditCaptureShortcuts.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";

  let openNodesUponSave =
    uiState.getState(UIState.openNodesUponSave, {
      scope: UIStateScope.PRODUCT
    }) ?? true;

  function handleToggleChange(event: CustomEvent<boolean>) {
    openNodesUponSave = event.detail;
    uiState.setState(UIState.openNodesUponSave, openNodesUponSave, {
      scope: UIStateScope.PRODUCT
    });
  }
</script>

<div class="flex flex-col gap-6 h-full w-full">
  <SwitchInput
    bind:checked={openNodesUponSave}
    size={Size.md}
    style={InputStyle.PLAIN}
    isExpanded={true}
    label={{
      label: "Automatically open newly created nodes after saving",
      tooltip: {
        body: "Disabling this will save the nodes in the background without opening."
      }
    }}
    onChange={handleToggleChange}
  />
  <div class="flex flex-col flex-grow w-full">
    <Text content="Shortcuts" style={TextStyle.PANEL_HEADING_SMALL} />
    <EditCaptureShortcuts />
  </div>
</div>
