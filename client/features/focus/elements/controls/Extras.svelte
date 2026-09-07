<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { Placement } from "@21n/types/direction.enum";
  import context from "@nucleum/stores/context.store";
  import type { IPopoverRenderBaseParams } from "@21n/types/popover.type";
  import { Size } from "@21n/types/size.enum";
  import view from "@nucleum/stores/view.store";
  import { Display } from "@21n/types/view.type";
  import { dispatchFocusPlayerPipRequest } from "@nucleum/features/focus/player/focusPlayer.events";
  import modalEvent, { fullScreen } from "@nucleum/components/modal/modal.store";
  let {
    isInFullScreen = false,
    parentBgIndex = 1
  }: {
    isInFullScreen?: boolean;
    parentBgIndex?: number;
  } = $props();
  const buttonProps: {
    parentBgIndex: number;
    size: Size.sm | Size.md | Size.lg;
    tooltipOptions: IPopoverRenderBaseParams;
  } = {
    parentBgIndex,
    size:
      $view.display === Display.MO || $view.display === Display.TP
        ? Size.md
        : Size.lg,
    tooltipOptions: {
      placement: Placement.TopCenter,
      offsetInPx: 4,
      isUseAbsolutePositioning: true
    }
  };
  function onFullScreenToggle() {
    if (!isInFullScreen) {
      modalEvent.hide(PointronAction.FOCUS);
      fullScreen.show(PointronAction.FULL_SCREEN_FOCUS);
    } else {
      fullScreen.hide();
    }
  }
</script>

<div
  class="flex gap-2 dp:gap-4 rounded-full border border-brs3 mo:px-2 py-1 dp:p-2 w-full justify-around"
>
  <Button
    icon="ph:flower-lotus-light"
    tooltip="Think mode"
    {...buttonProps}
    onclick={() => {
      appStore.runAction(PointronAction.THINK_MODE);
    }}
  />
  {#if $activeSession.type !== SessionType.PREDEFINED_INTERVALS}
    <Button
      icon="x-circle"
      tooltip="Abandon focus session"
      {...buttonProps}
      onclick={() => {
        appStore.runAction(PointronAction.ABANDON_SESSION);
      }}
    />
  {/if}
  {#if !$context.isEmbed}
    <Button
      icon="pip"
      tooltip="Picture in picture"
      {...buttonProps}
      onclick={(event) => {
        dispatchFocusPlayerPipRequest(event);
      }}
    />
  {/if}
  <Button
    icon={isInFullScreen ? "exitfullscreen" : "fullscreen"}
    tooltip={isInFullScreen ? "Exit full screen" : "Full screen"}
    {...buttonProps}
    onclick={onFullScreenToggle}
  />
</div>
