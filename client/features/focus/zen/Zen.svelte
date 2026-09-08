<script lang="ts">
  import { startTouch, moveTouch } from "@21n/utils/touchGesture";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { SessionUIContext } from "@nucleum/features/focus/session.type";
  import { isInEditMode } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import { Size } from "@21n/elements/size.enum";
  import SessionTimeText from "@nucleum/features/focus/elements/sessionTimeText/SessionTimeText.svelte";
  import ControlBar from "@nucleum/features/focus/elements/controls/ControlBar.svelte";
  import FocusItemList from "@nucleum/features/focus/elements/focusitem/FocusItemList.svelte";
  import IntervalBar from "@nucleum/features/focus/elements/intervalbar/IntervalBar.svelte";
  import FocusItemsHeading from "@nucleum/features/focus/zen/FocusItemsHeading.svelte";
  import TimeleftIndicator from "@nucleum/features/focus/zen/timeleftindicator/TimeleftIndicator.svelte";
  import { SessionType } from "@nucleum/features/focus/logs/log.type";
  import { AppSkin } from "@21n/theme/appearance.type";
  import Divider from "@21n/elements/Divider.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import Extras from "@nucleum/features/focus/elements/controls/Extras.svelte";
  import SessionNotes from "@nucleum/features/focus/notes/SessionNotes.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { fullScreen } from "@nucleum/stores/overlays/modal.store";
  import { page } from "$app/stores";
  import { AccessMode } from "@nucleum/datafn/resource.type";
  import { PointronAction } from "@nucleum/client/config/focus-action.enum";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import { getContext } from "svelte";
  import { readable, type Writable } from "svelte/store";
  import { Context } from "@nucleum/stores/appStore.type";
  import type { IContainer } from "@21n/layout/layout.type";
  import { resolveMinWidth } from "@21n/layout/layout.utils";

  const container =
    getContext<Writable<IContainer | undefined>>(Context.CONTAINER) ||
    readable(undefined);

  let { isInline = false }: { isInline?: boolean } = $props();
  const MIN_WIDTH_TO_EXPAND = resolveMinWidth(2);
  let layout: number = 1;
  let isShowTimeLeftOnMobile: boolean = false;
  let fullScreenFocusIsEnabled = $derived(
    $page?.url?.searchParams?.get(AccessMode.FULL) ===
      PointronAction.FULL_SCREEN_FOCUS
  );
  let isExtraLargeScreen = $derived(
    $container && $container.landscapiness > 1.7 && $view.scale > 1.8
  );
</script>

{#if $view.isPortrait || ($container && ($container.isPortrait || $container.width < MIN_WIDTH_TO_EXPAND))}
  {@const isMobile = $view.isPortrait}
  <div
    ontouchstart={(event) => {
      event.stopPropagation();
      startTouch(event);
    }}
    ontouchmove={(event) => {
      event.stopPropagation();
      moveTouch(
        event,
        undefined,
        undefined,
        fullScreen.hide,
        undefined,
        undefined
      );
    }}
    class="flex flex-col w-full h-full px-4 py-8 glassthick bg-bgs1 otop:pt-12"
  >
    <div class="flex flex-col gap-6 flex-grow w-full items-center">
      {#if (isMobile && !$isInEditMode) || !isMobile}
        <IntervalBar />
        <div
          class="flex flex-col w-full items-center transition-all duration-300"
        >
          <SessionTimeText size={Size.sm} />
          {#if $activeSession.type != SessionType.COUNTUP && isShowTimeLeftOnMobile}
            <div class="w-full px-6">
              <TimeleftIndicator parentBgIndex={0} />
            </div>
          {/if}
        </div>
      {/if}
      <div
        id="focusItems"
        ontouchstart={(event) => {
          event.stopPropagation();
          startTouch(event);
        }}
        class="flex flex-col flex-grow gap-2 p-2 w-full h-64 overflow-auto styledscroll rounded-md bg-bgs1 transition-all duration-300"
      >
        <FocusItemsHeading />
        <FocusItemList isInEditMode={$isInEditMode} />
      </div>
    </div>
    {#if ((isMobile && !isInline) || !isMobile) && !$isInEditMode}
      <div class="flex flex-col gap-12">
        <div class="flex w-full justify-center">
          <ControlBar />
        </div>
        <div class="flex justify-center">
          <Extras isInFullScreen={$view.isPortrait && !isInline} />
        </div>
      </div>
    {/if}
  </div>
{:else if layout == 1}
  {@const parentBgIndex = isInline && !$activeSession.isQuickStartOn ? 1 : 2}
  <div
    class="flex w-full h-full {$userPreferences?.appearance?.skin ===
    AppSkin.Glassy
      ? 'glassthick'
      : ''}"
    aria-roledescription="zen mode"
  >
    <div
      class={cn("flex flex-col items-center justify-center flex-grow ", {
        "bg-bgs1": parentBgIndex === 1,
        "bg-bgs2": !isInline || $activeSession.isQuickStartOn
      })}
    >
      <div class="flex flex-col justify-between w-full h-full py-6 px-10">
        <IntervalBar
          context={isInline
            ? SessionUIContext.DEFAULT
            : SessionUIContext.ZEN_ON_DESKTOP}
        />
        <div class="flex flex-col w-full items-center px-4 lg:px-8 xl:px-20">
          <SessionTimeText parentBackgroundIndex={parentBgIndex} />
          {#if $activeSession.type != SessionType.COUNTUP}
            <TimeleftIndicator {parentBgIndex} />
          {/if}
        </div>
        <div class="flex flex-col gap-20">
          <div class="flex w-full justify-center">
            <ControlBar />
          </div>
          <div class="flex justify-center">
            <div class="w-3/4 xl:w-1/2">
              <Extras isInFullScreen={!isInline} {parentBgIndex} />
            </div>
          </div>
        </div>
      </div>
    </div>
    {#if !isInline || !$activeSession.isQuickStartOn}
      {#if isInline}
        <Divider orientation={Orientation.Vertical} />
      {/if}
      <div class="flex flex-col gap-4 pt-6 p-6 w-96 xl:w-1/3 2xl:1/4 bg-bgs1">
        <FocusItemsHeading />
        <div class="overflow-y-auto h-full">
          <FocusItemList isInEditMode={$isInEditMode} />
        </div>
      </div>
    {/if}
    {#if isExtraLargeScreen && ((isInline && !fullScreenFocusIsEnabled) || !isInline)}
      <div class="w-1/4 2k:min-w-96 p-4">
        <SessionNotes />
      </div>
    {/if}
  </div>
{/if}
