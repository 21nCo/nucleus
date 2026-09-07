<script lang="ts">
  import SwitcherItem from "@nucleum/features/focus/advanced/modeSwitcher/SwitcherItem.svelte";

  let {
    selectedMode = $bindable(0),
    onSwitch = undefined
  }: {
    selectedMode?: number;
    onSwitch?: ((event: CustomEvent<{ selected: number }>) => void) | undefined;
  } = $props();
  function switchMode(mode: number) {
    selectedMode = mode;
    const switchEvent = new CustomEvent<{ selected: number }>("switch", {
      detail: { selected: mode }
    });
    onSwitch?.(switchEvent);
  }
</script>

<div class="flex w-full justify-center gap-12">
  <SwitcherItem
    mode={0}
    isActive={selectedMode === 0}
    onclick={() => switchMode(0)}
  />
  <SwitcherItem
    mode={1}
    isActive={selectedMode === 1}
    onclick={() => switchMode(1)}
  />
</div>
