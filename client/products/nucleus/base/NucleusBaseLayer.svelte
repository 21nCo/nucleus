<svelte:options runes={true} />

<script lang="ts">
  import type { Snippet } from "svelte";
  import { onMount } from "svelte";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { appLoadingState, appStore } from "@nucleum/stores/app.store";
  import context from "@nucleum/stores/context.store";
  import UserBaseLayer from "@21n/layout/layers/UserBaseLayer.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import { resourceAction } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
  import FocusTopNavWidget from "@nucleum/features/focus/player/FocusTopNavWidget.svelte";
  import PointronNotifications from "@nucleum/products/pointron/base/Notifications.svelte";
  import MemotronNotifications from "@nucleum/products/memotron/base/MemotronNotifications.svelte";
  import BackgroundSoundPlayer from "@nucleum/features/focus/backgroundMusic/BackgroundSoundPlayer.svelte";
  import SessionTitle from "@nucleum/products/pointron/base/SessionTitle.svelte";
  import MemoryBase from "@nucleum/products/memotron/base/MemoryBase.svelte";
  import TopNavLeftMenuItem from "@21n/layout/topNav/TopNavLeftMenuItem.svelte";
  import { Action } from "@nucleum/client/config/action.enum";
  let { children }: { children?: Snippet } = $props();
  let isLiteMode = $state($context.isEmbed && $context.isSheet);

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
    //TODO
  }

  function onAppear() {
    //TODO
  }

  async function onReady() {
    if (isLiteMode) return;
    // TODO
    $appLoadingState.isLocalLoaded = true;
  }
</script>

<UserBaseLayer {onReady}>
  {#snippet topnav()}
    <div class="flex items-center h-full">
      <TopNavLeftMenuItem
        action={resourceAction(Resource.node, ResourceActionType.CREATE)}
      />
      <FocusTopNavWidget />
      <!-- {#if isDebug}
        <TopNavLeftMenuItem action={Action.FEED} />
      {/if} -->
    </div>
  {/snippet}
  {@render children?.()}
  <PointronNotifications />
  <MemotronNotifications />
  <BackgroundSoundPlayer />
  <SessionTitle />
</UserBaseLayer>
<MemoryBase />
