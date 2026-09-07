<script>
  import Button from "@21n/elements/button/Button.svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import {
    UIState,
    UIStateScope
  } from "@nucleum/stores/uiState/uiState.type";
  import { Layout } from "@21n/layout/layout-mode.type";
  import { Size } from "@21n/elements/size.enum";
  import { onMount } from "svelte";
  let layout = refreshLayoutState();
  onMount(() => {
    const sub = uiState.subscribe((x) => {
      layout = refreshLayoutState();
    });
    return () => {
      sub();
    };
  });
  function refreshLayoutState() {
    const layoutState = uiState.getState(UIState.quickFocusLayout, {
      scope: UIStateScope.DEVICE
    });
    return layoutState ?? Layout.LIST;
  }
</script>

<Button
  icon={layout === Layout.LIST ? "bars" : "grid"}
  size={Size.lg}
  onclick={() => {
    uiState.setState(
      UIState.quickFocusLayout,
      layout === Layout.LIST || !layout ? Layout.GRID : Layout.LIST,
      {
        scope: UIStateScope.DEVICE
      }
    );
  }}
/>
