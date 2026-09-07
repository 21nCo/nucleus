<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { TileScale } from "@nucleum/features/calendar/calendarHeatmap/calendarHeatmap.types";
  import { isTouchDevice } from "@nucleum/stores/app.store";
  import { moveTouch } from "@21n/utils/touchGesture";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import { Size } from "@21n/types/size.enum";
  import { Orientation } from "@21n/types/direction.enum";
  let {
    orientation,
    onPrev = undefined,
    onNext = undefined,
    onSwitch = undefined
  }: {
    orientation: Orientation;
    onPrev?: (() => void) | undefined;
    onNext?: (() => void) | undefined;
    onSwitch?: ((scale: TileScale) => void) | undefined;
  } = $props();
  let activeButton = $state<TileScale>(TileScale.DAYS);
  function chevleft() {
    onPrev?.();
  }
  function chevright() {
    onNext?.();
  }
</script>

<div
  ontouchmove={(event) => {
    if (orientation === Orientation.Vertical)
      moveTouch(event, chevright, undefined, chevleft, undefined);
    else moveTouch(event, undefined, chevleft, undefined, chevright, undefined);
  }}
>
  <div class="flex w-full justify-center items-center gap-x-px p-1">
    <div class="flex ml-auto">
      <PanelSwitcher
        items={Object.values(TileScale)}
        bind:value={activeButton}
        size={Size.sm}
        style={PanelSwitcherStyle.TRAIN}
        onSwitch={(event) => {
          onSwitch?.(event.detail);
        }}
      />
    </div>
    <div class="ml-auto flex">
      {#if $isTouchDevice == false}
        {#if orientation === Orientation.Vertical}
          <div class="flex flex-col">
            <Button icon="chevron-up" size={Size.sm} onclick={chevleft} />
            <Button icon="chevron-down" size={Size.sm} onclick={chevright} />
          </div>
        {:else}
          <div class="self-center">
            <Button icon="chevron-left" onclick={chevleft} />
          </div>
          <div class="self-center mr-2">
            <Button icon="chevron-right" onclick={chevright} />
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
