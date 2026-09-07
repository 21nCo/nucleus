<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import Notifications from "@nucleum/products/pointron/base/Notifications.svelte";
  import { onMount } from "svelte";
  import {
    activeSession,
    focusItemsStore
  } from "@nucleum/features/focus/session.store";
  import { appLoadingState, appStore } from "@nucleum/stores/app.store";
  import BackgroundSoundPlayer from "@nucleum/features/focus/backgroundMusic/BackgroundSoundPlayer.svelte";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import context from "@nucleum/stores/context.store";
  import UserBaseLayer from "@21n/layout/layers/UserBaseLayer.svelte";
  import { uiState } from "@nucleum/stores/uiState/uiState.store";
  import { fullScreen } from "@nucleum/application/modal/modal.store";
  import { UIState } from "@nucleum/stores/uiState/uiState.type";
  import SessionTitle from "@nucleum/products/pointron/base/SessionTitle.svelte";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import { PointronEvent } from "@21n/types/pointron/pointronEvent.enum";
  import FocusTopNavWidget from "@nucleum/features/focus/player/FocusTopNavWidget.svelte";
  import { Product } from "@21n/types/product.type";
  let { children }: { children?: Snippet } = $props();
  let isLiteMode = $state($context.isEmbed && $context.isSheet);
  const isDebug = import.meta.env?.DEV;

  onMount(() => {
    initializeData();
    window.addEventListener("focus", onAppear);
    return () => {
      activeSession.clearIntervals();
      window.removeEventListener("focus", onAppear);
    };
  });

  async function initializeData() {
    if (isLiteMode) return;
    if ($activeSession?.isSessionRunning) {
      fullScreen.show(PointronAction.FULL_SCREEN_FOCUS);
    }
  }

  function onAppear() {
    if (
      $activeSession.state === SessionState.FINISHED ||
      $activeSession.state === SessionState.PRE_FINISHED
    ) {
      appStore.runAction(PointronEvent.SESSION_FINISHED);
    }
  }

  async function onReady() {
    if (isLiteMode) return;
    const state = uiState.getState(UIState.recentFocusItems);
    if (state) {
      await focusItemsStore.refreshRecents(state);
    }
    $appLoadingState.isLocalLoaded = true;
  }
</script>

<UserBaseLayer onReady={onReady}>
  {#snippet topnav()}
    <div class="flex gap-1 items-center h-full">
      <FocusTopNavWidget />
    </div>
  {/snippet}
  {@render children?.()}
  <SessionTitle ctx={Product.POINTRON} />
  <Notifications />
  <BackgroundSoundPlayer />
</UserBaseLayer>
