<script lang="ts">
  import { startTouch, moveTouch } from "@21n/utils/touchGesture";
  import {
    activeSession,
    currentFocusItem
  } from "@nucleum/features/focus/session.store";
  import { SessionUIContext } from "@21n/types/pointron/session.type";
  import Icon from "@21n/elements/Icon.svelte";
  import view from "@nucleum/stores/view.store";
  import ControlBar from "@nucleum/features/focus/elements/controls/ControlBar.svelte";
  import { onMount, tick } from "svelte";
  import FocusPlayerTimeText from "@nucleum/features/focus/player/FocusPlayerTimeText.svelte";
  import InlineLoadingAnimation from "@21n/elements/feedback/animations/InlineLoadingAnimation.svelte";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import context from "@nucleum/stores/context.store";
  import ThemeLayer from "@21n/layout/layers/themeLayer/ThemeLayer.svelte";
  import appearance, {
    fallBackTypefaceString
  } from "@nucleum/stores/appearance.store";
  import IntervalBar from "@nucleum/features/focus/elements/intervalbar/IntervalBar.svelte";
  import { fullScreen, player } from "@nucleum/components/modal/modal.store";
  import { logger } from "@nucleum/components/debug/logger.client";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { resolveObjectiveColor } from "@nucleum/features/focus/goals/goal.utils";
  import { hoverable } from "@nucleum/actions/hover.action";
  import { tooltip } from "@nucleum/actions/popover.action";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import type { ITaskThumb } from "@nucleum/features/focus/tasks/task.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  import type { IRecordId } from "@21n/types/data.type";
  import { focusPlayerPipRequestEvent } from "@nucleum/features/focus/player/focusPlayer.events";
  let playerContainerRef: any;
  let playerRef: HTMLElement | null = document.getElementById("focusplayer");
  let playerContainer: HTMLElement | null =
    document.getElementById("playercontainer");
  let isPipShown = $state(false);
  let hoverState = $state({
    caretHovering: false,
    pipHovering: false
  });
  let isRenderPip = $state(false);
  let wasSessionRunningForPip = false;
  let pendingNotStartedPipClose: ReturnType<typeof setTimeout> | undefined;
  let pendingPipOffClose: ReturnType<typeof setTimeout> | undefined;
  let isPipOpening = false;
  const isBreakReminderMode = $derived(
    $activeSession.timeRemainingToTakeBreak != undefined &&
      $activeSession.timeRemainingToTakeBreak < 0
  );
  const currentFocusItemRecordStore = $derived.by(() => {
    const focusItem = $currentFocusItem;
    if (!focusItem?.id) return undefined;
    const resource = determineResourceType(focusItem.id);
    return toSvelteStore<
      Array<(ITaskThumb | IObjectiveThumb) & { id: IRecordId }>
    >(
      datafn.table(resource).signal({
        filters: { id: focusItem.id },
        select: resource === "task" ? ["*", "objective.*"] : ["*", "parent.*"],
        limit: 1,
        metadata: {
          includeTrashed: true,
          includeArchived: true
        }
      }),
      { initialData: [] }
    );
  });
  const curentFocusItemExpanded = $derived.by(() => {
    if (!currentFocusItemRecordStore) return undefined;
    return $currentFocusItemRecordStore!.data[0] as
      | ITaskThumb
      | IObjectiveThumb
      | undefined;
  });

  function enableFullScreenPlayer() {
    if (isPipShown) return;
    fullScreen.show(PointronAction.FULL_SCREEN_FOCUS);
  }
  function clickHandler(event: any) {
    //if ($windowObject.isInPortraitMode) return;
    enableFullScreenPlayer();
  }

  function resolveCurrentFocusItemGoal(
    item: ITaskThumb | IObjectiveThumb | undefined
  ): IObjectiveThumb | undefined {
    if (!item) return undefined;
    if ("objective" in item || "objectiveId" in item) {
      return item.objective as IObjectiveThumb | undefined;
    }
    return item as IObjectiveThumb;
  }

  function clearPendingNotStartedPipClose() {
    if (!pendingNotStartedPipClose) return;
    clearTimeout(pendingNotStartedPipClose);
    pendingNotStartedPipClose = undefined;
  }

  function clearPendingPipOffClose() {
    if (!pendingPipOffClose) return;
    clearTimeout(pendingPipOffClose);
    pendingPipOffClose = undefined;
  }

  function closePip() {
    clearPendingNotStartedPipClose();
    clearPendingPipOffClose();
    isPipOpening = false;
    if (playerRef && $activeSession.isSessionRunning)
      playerContainer?.append(playerRef);
    isPipShown = false;
    isRenderPip = false;
    if ($player.isPipOn) {
      player.togglePip(PointronAction.FOCUS_PLAYER);
    }
    if (pipWindowRef && pipWindowPageHideHandler) {
      try {
        pipWindowRef.removeEventListener("pagehide", pipWindowPageHideHandler);
      } catch (e) {
        logger.error({ at: "closePip:removeEventListener", e });
      }
    }
    pipWindowPageHideHandler = null;
    if ("documentPictureInPicture" in window)
      (window.documentPictureInPicture as any).window?.close();
    pipWindowRef = null;
  }
  let pipWindowRef: any = null;
  let pipWindowPageHideHandler: ((event: any) => void) | null = null;
  function syncPipState(isOn: boolean) {
    if ($player.isPipOn !== isOn) {
      player.togglePip(PointronAction.FOCUS_PLAYER);
    }
  }

  function resetPipStateAfterFailedOpen() {
    isPipShown = false;
    isRenderPip = false;
    syncPipState(false);
  }

  function resolvePipErrorName(error: unknown) {
    if (error instanceof DOMException) return error.name;
    if (typeof error === "object" && error && "name" in error) {
      return String((error as { name?: unknown }).name ?? "");
    }
    return "";
  }

  function isExpectedPipOpenFailure(error: unknown) {
    return [
      "AbortError",
      "InvalidStateError",
      "NotAllowedError",
      "NotSupportedError",
      "SecurityError"
    ].includes(resolvePipErrorName(error));
  }

  function resolvePipWindowDimension(
    dimension: number | undefined,
    fallback: number
  ) {
    const normalizedDimension = Math.round(dimension ?? fallback);
    if (!Number.isFinite(normalizedDimension) || normalizedDimension < 1) {
      return fallback;
    }
    return normalizedDimension;
  }

  function resolvePipWindowOptions() {
    const containerWidth = playerContainerRef?.clientWidth;
    const containerHeight = playerContainerRef?.clientHeight;
    const playerWidth = playerRef?.clientWidth;
    const playerHeight = playerRef?.clientHeight;
    const width =
      typeof containerWidth === "number" && containerWidth > 20
        ? containerWidth - 20
        : playerWidth;
    const height =
      typeof containerHeight === "number" && containerHeight > 0
        ? containerHeight + 80
        : typeof playerHeight === "number" && playerHeight > 0
          ? playerHeight + 80
          : undefined;
    return {
      width: resolvePipWindowDimension(width, 420),
      height: resolvePipWindowDimension(height, 160)
    };
  }

  async function showPip(event: Event | null) {
    event?.stopPropagation();
    if (!playerRef || isPipOpening) return;
    try {
      if (
        !("documentPictureInPicture" in window) ||
        !window.documentPictureInPicture
      ) {
        resetPipStateAfterFailedOpen();
        return;
      }
      if (!(window.documentPictureInPicture as any).window) {
        clearPendingNotStartedPipClose();
        isPipOpening = true;
        const pipWindow = await (
          window.documentPictureInPicture as any
        ).requestWindow(resolvePipWindowOptions());
        pipWindowPageHideHandler = (_event: any) => {
          closePip();
        };
        pipWindow.addEventListener("pagehide", pipWindowPageHideHandler);
        pipWindowRef = pipWindow;

        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules]
              .map((rule) => rule.cssText)
              .join("");
            const style = document.createElement("style");

            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement("link");

            link.rel = "stylesheet";
            link.type = styleSheet.type;
            // link.media = styleSheet.media;
            // link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });
        pipWindow.document.body.append(playerRef);
        pipWindow.document.body.style.height = "100vh";
        pipWindow.document.body.style.width = "100vw";
        isPipShown = true;
        isRenderPip = true;
        syncPipState(true);
      } else if (event) {
        closePip();
      }
    } catch (e) {
      const isExpectedFailure = isExpectedPipOpenFailure(e);
      resetPipStateAfterFailedOpen();
      if (!isExpectedFailure) {
        logger.error({ at: "pipHandler", e });
      }
    } finally {
      isPipOpening = false;
    }
  }
  function handleExternalPipRequest(event: Event) {
    const sourceEvent = (event as CustomEvent<{ sourceEvent?: Event }>).detail
      ?.sourceEvent;
    void showPip(sourceEvent ?? event);
  }

  function scheduleNotStartedPipClose() {
    clearPendingNotStartedPipClose();
    pendingNotStartedPipClose = setTimeout(() => {
      pendingNotStartedPipClose = undefined;
      if (
        $activeSession.state === SessionState.NOT_STARTED &&
        !$activeSession.isSessionRunning
      ) {
        closePip();
      }
    }, 300);
  }

  function schedulePipOffClose() {
    clearPendingPipOffClose();
    pendingPipOffClose = setTimeout(() => {
      pendingPipOffClose = undefined;
      if ($player.isPipOn || !isPipShown) return;
      if ($activeSession.isSessionRunning) {
        syncPipState(true);
        return;
      }
      closePip();
    }, 300);
  }

  function handleSessionPipStateUpdate(
    state: SessionState,
    isSessionRunning: boolean
  ) {
    if (state === SessionState.FINISHED) {
      clearPendingNotStartedPipClose();
      wasSessionRunningForPip = isSessionRunning;
      closePip();
      return;
    }
    if (state === SessionState.NOT_STARTED && wasSessionRunningForPip) {
      scheduleNotStartedPipClose();
    } else if (state !== SessionState.NOT_STARTED || isSessionRunning) {
      clearPendingNotStartedPipClose();
    }
    wasSessionRunningForPip = isSessionRunning;
  }

  onMount(() => {
    playerRef = document.getElementById("focusplayer");
    playerContainer = document.getElementById("playercontainer");
    window.addEventListener(
      focusPlayerPipRequestEvent,
      handleExternalPipRequest
    );
    const sessionSub = activeSession.subscribe(async (x) => {
      handleSessionPipStateUpdate(x.state, x.isSessionRunning);
    });
    const sub = player.subscribe(async (x) => {
      if (x.isPipOn && !isPipShown) {
        clearPendingPipOffClose();
        isRenderPip = true;
        await tick();
        if ($player.isPipOn && !isPipShown) {
          void showPip(null);
        }
      } else if (!x.isPipOn && isPipShown) {
        schedulePipOffClose();
      }
    });
    return () => {
      window.removeEventListener(
        focusPlayerPipRequestEvent,
        handleExternalPipRequest
      );
      sub();
      sessionSub();
      clearPendingNotStartedPipClose();
      clearPendingPipOffClose();
    };
  });
</script>

<div
  ontouchstart={(event) => {
    event.stopPropagation();
    startTouch(event);
  }}
  ontouchmove={(event) => {
    event.stopPropagation();
    moveTouch(
      event,
      enableFullScreenPlayer,
      undefined,
      undefined,
      undefined,
      20
    );
  }}
  id="playercontainer"
  class={!$view.isPortrait ? "m--6" : "w-full"}
  bind:this={playerContainerRef}
>
  <div
    id="focusplayer"
    data-testid="focus-player"
    class={cn("flex h-full w-full", $appearance.colorScheme.tailwindSelector, {
      "text-base text-fgs1": isPipShown,
      "bg-bgs1": isPipShown && !isBreakReminderMode,
      "bg-ars1 animate--pulse animate-pulse-subtle":
        isBreakReminderMode && isPipShown
    })}
    style={isPipShown
      ? "font-family: {$appearance.typeface ?? fallBackTypefaceString};"
      : ""}
  >
    <ThemeLayer extensionContext={isPipShown ? "focusplayer" : undefined}>
      <div
        class={cn("flex flex-col gap-1 w-full", {
          hidden: !isRenderPip && !$view.isConstrainedWidth,
          "opacity-0": isRenderPip && !isPipShown
        })}
      >
        <CustomColorPropagator
          type="button"
          color={resolveObjectiveColor(
            resolveCurrentFocusItemGoal(curentFocusItemExpanded)
          )}
          class={cn(
            "flex gap-2 h-full justify-between items-center px-4 py-2",
            isPipShown && {
              "text-abg": isBreakReminderMode,
              "bg-bgs2 dark:bg-[#202124]": !isBreakReminderMode
            },
            !isPipShown && {
              "border-t border-bgs3 border-opacity-50": true,
              "w-full": $view.isPortrait,
              "w-[26rem] rounded-md": !$view.isPortrait,
              "bg-ars1 text-abg": isBreakReminderMode,
              "bg-ccs1 text-cbg":
                $activeSession.state === SessionState.FOCUS_RUNNING &&
                !isBreakReminderMode,
              "bg-ass1 text-abg":
                $activeSession.state != SessionState.FOCUS_RUNNING
            },
            isPipShown && {
              "w-full": true
            }
          )}
          onclick={clickHandler}
        >
          {#if $activeSession.state === SessionState.FINISHED}
            <div class="flex w-full h-12 justify-center items-center">
              <InlineLoadingAnimation />Finishing session...
            </div>
          {:else}
            <div class="flex items-center gap-4 h-full flex-1 min-w-0">
              <FocusPlayerTimeText
                context={isPipShown
                  ? SessionUIContext.PIP
                  : SessionUIContext.FOCUS_PLAYER}
              />
            </div>
            <div class="flex gap-4">
              <ControlBar
                context={isPipShown
                  ? SessionUIContext.PIP
                  : SessionUIContext.FOCUS_PLAYER}
              />
              {#if !$view.isPortrait && !isPipShown}
                {#if !$context.isEmbed}
                  <button
                    class="flex items-center justify-center"
                    onclick={showPip}
                    use:hoverable={{
                      onHover: (v) => {
                        hoverState.pipHovering = v;
                      }
                    }}
                    use:tooltip={{
                      text: "Picture in Picture"
                    }}
                  >
                    <Icon
                      icon="pip"
                      isTabbable={true}
                      isFilled={hoverState.pipHovering}
                      class={cn({
                        "stroke-cbg":
                          $activeSession.state === SessionState.FOCUS_RUNNING &&
                          !isBreakReminderMode,
                        "stroke-abg":
                          isBreakReminderMode ||
                          $activeSession.state != SessionState.FOCUS_RUNNING
                      })}
                    />
                  </button>
                {/if}
                <div
                  class="flex justify-center items-center"
                  use:hoverable={{
                    onHover: (v) => {
                      hoverState.caretHovering = v;
                    }
                  }}
                  use:tooltip={{
                    text: "Full screen"
                  }}
                >
                  <Icon
                    icon="chevron-up"
                    onclick={clickHandler}
                    isTabbable={true}
                    isFilled={hoverState.caretHovering}
                    class={cn({
                      "stroke-cbg":
                        $activeSession.state === SessionState.FOCUS_RUNNING &&
                        !isBreakReminderMode,
                      "stroke-abg":
                        isBreakReminderMode ||
                        $activeSession.state != SessionState.FOCUS_RUNNING
                    })}
                  />
                </div>
              {/if}
            </div>
          {/if}
        </CustomColorPropagator>
        {#if isPipShown}
          <div
            class={cn("flex w-full flex-1 px-4 pb-2", {
              "text-abg": isBreakReminderMode
            })}
          >
            <IntervalBar context={SessionUIContext.PIP} />
          </div>
        {/if}
      </div>
    </ThemeLayer>
  </div>
</div>
