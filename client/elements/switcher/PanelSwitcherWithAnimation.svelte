<script lang="ts">
  import type { PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import { onMount } from "svelte";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  let {
    items,
    value = $bindable(""),
    style,
    interval = 4000
  }: {
    items: string[];
    value?: string;
    style: PanelSwitcherStyle;
    interval?: number;
  } = $props();
  let intervalTimer = $state<any>();
  onMount(() => {
    intervalTimer = startIntervalTimer();
    return () => {
      clearInterval(intervalTimer);
    };
  });
  function startIntervalTimer() {
    return setInterval(() => {
      let selectedIndex = items.indexOf(value);
      selectedIndex = (selectedIndex + 1) % items.length;
      value = items[selectedIndex];
    }, interval);
  }
</script>

<PanelSwitcher
  {items}
  bind:value
  {style}
  onSwitch={() => {
    clearInterval(intervalTimer);
    intervalTimer = startIntervalTimer();
  }}
/>
