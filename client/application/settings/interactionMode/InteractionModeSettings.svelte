<script lang="ts">
  import Divider from "@21n/elements/Divider.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { UIState, UIStateScope } from "@nucleum/stores/uiState/uiState.type";
  import view from "@nucleum/stores/view.store";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import { Orientation } from "@21n/elements/direction.enum";
  import { OptionSelectorStyle } from "@21n/elements/select/select.type";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import ShortcutSettings from "@nucleum/application/shortcuts/settings/ShortcutSettings.svelte";
  import { InteractionMode } from "@21n/elements/keyboard/interaction-mode.type";
  const persistedMode = uiState.getState(Action.MODE_OF_INTERACTION, {
    scope: UIStateScope.PRODUCT
  });
  const initialMode =
    persistedMode === InteractionMode.KEYBOARD_CENTRIC
      ? InteractionMode.DEFAULT
      : persistedMode === InteractionMode.COMMAND_ONLY ||
          persistedMode === InteractionMode.VOICE_ONLY
        ? InteractionMode.AGENT
        : (persistedMode ?? InteractionMode.DEFAULT);
  let selectedMode = $state<InteractionMode>(initialMode);
  let isShortcutHintsEnabled = $state(
    uiState.getState(UIState.hideShortcutHints, {
      scope: UIStateScope.DEVICE
    }) ?? false
  );
  let isCompletelyHideLeftNavBar = $state(
    uiState.getState(UIState.completelyHideLeftNavBar, {
      scope: UIStateScope.PRODUCT
    }) ?? false
  );
</script>

<div
  class="flex flex-col gap-6 overflow-auto"
  data-testid="mode-of-interaction-settings"
>
  <OptionSelector
    bind:selected={selectedMode}
    onSelect={(event) => {
      uiState.setState(Action.MODE_OF_INTERACTION, event.detail, {
        scope: UIStateScope.PRODUCT
      });
    }}
    style={OptionSelectorStyle.TRAIN}
    size={$view.isConstrainedWidth ? Size.sm : Size.md}
    labelProps={{
      label: "Preferred mode of interaction",
      tooltip: {
        body: "We will change the design of the app based your preferred mode of interaction."
      },
      orientation: Orientation.Vertical
    }}
    options={[
      {
        value: InteractionMode.DEFAULT,
        icon: "circle-dashed"
      },
      {
        value: InteractionMode.AGENT,
        label: "Home only",
        icon: "home"
      }
    ]}
  />
  {#if selectedMode === InteractionMode.DEFAULT}
    <div data-testid="toggle-hide-shortcut-hints">
      <SwitchInput
        label={{
          label: "Hide all hot key and shortcut hints",
          tooltip: {
            body: "All hot key and shortcut hints will be hidden at relevant places throughout the app."
          }
        }}
        isExpanded={true}
        bind:checked={isShortcutHintsEnabled}
        onChange={(e) => {
          uiState.setState(UIState.hideShortcutHints, e.detail, {
            scope: UIStateScope.DEVICE
          });
        }}
      />
    </div>
    <div data-testid="toggle-hide-menu-bar">
      <SwitchInput
        bind:checked={isCompletelyHideLeftNavBar}
        onChange={(e) => {
          uiState.setState(UIState.completelyHideLeftNavBar, e.detail, {
            scope: UIStateScope.PRODUCT
          });
        }}
        label={{
          label: "Hide App menu bar on hot key",
          tooltip: {
            body: "Completely hides the app menu bar on usage of the hot key **Q**. By default, it minimizes the app menu bar."
          }
        }}
        isExpanded={true}
      />
    </div>
    <Divider />
  {/if}
  <div class="flex flex-col items-start w-full gap-3">
    <Text content="Keyboard shortcuts" style={TextStyle.SECTION_HEADING} />
    <ShortcutSettings />
  </div>
  <ScrollViewBottomSpacer />
</div>
