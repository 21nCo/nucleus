<script lang="ts">
  import type { Snippet } from "svelte";
  import "@nucleum/client/app.css";
  import ThemeLayer from "@21n/layout/layers/themeLayer/ThemeLayer.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { appearance } from "@nucleum/stores/appearance.store";
  import { onDestroy, onMount } from "svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import account from "@nucleum/stores/account.store";
  import { getDapId } from "@nucleum/persistence/persistence.utils";
  import { appStore } from "@nucleum/stores/app.store";
  import { Extension } from "@nucleum/client/config/product.type";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
  import { clientStorage } from "@nucleum/persistence/persistence.utils";
  import { pingParent } from "@21n/utils/embed.utils";
  import SheetDebugLogs from "@nucleum/extensions/SheetDebugLogs.svelte";
  import context from "@nucleum/stores/context.store";
  import { Size } from "@21n/elements/size.enum";
  import view from "@nucleum/stores/view.store";
  import {
    initializeNucleumDatafn,
    pullDatafnNow
  } from "@nucleum/datafn/datafn.store";

  let {
    extension,
    children = undefined
  }: {
    extension: Extension;
    children?: Snippet | undefined;
  } = $props();
  let isInitialized: boolean = false;
  let isAuthenticating: boolean = false;
  let error: string | undefined = undefined;
  let token = new URLSearchParams(window.location.search).get("token");
  let debugLog: string[] = [];
  let tokenCheckTimeout: ReturnType<typeof setTimeout> | undefined;
  view.refresh(window.innerWidth, window.innerHeight);

  onMount(async () => {
    addToDebugLog("Mounted");
    pingParent();
    addToDebugLog("Pinged parent");
    tokenCheckTimeout = setTimeout(() => {
      if (!token) {
        error = "Session not found. Please login on the app.";
      }
    }, 5000);
    try {
      await bootup();
    } catch (e) {
      logger.error({ at: "SheetBaseLayer.onMount", error: e });
    }
  });

  function addToDebugLog(log: string) {
    debugLog = [...debugLog, log];
    logger.log({ at: "SheetBaseLayer", log });
  }

  let interval: any;
  interval = setInterval(() => {
    proceedDatafnSync();
  }, 3500);

  onDestroy(() => {
    clearInterval(interval);
    clearTokenCheckTimeout();
  });

  function proceedDatafnSync() {
    if (isInitialized) {
      void pullDatafnNow().catch((error) => {
        logger.error({ at: "SheetBaseLayer.proceedDatafnSync", error });
      });
    }
  }

  function clearTokenCheckTimeout() {
    if (tokenCheckTimeout) {
      clearTimeout(tokenCheckTimeout);
      tokenCheckTimeout = undefined;
    }
  }

  async function handleMessageFromParent(event: any) {
    try {
      if (event?.data?.type === "SWIFT_MESSAGE") {
        if (event?.data?.payload) {
          if (typeof event.data.payload !== "string") return;
          if (!event.data.payload.trim().startsWith("{")) return;
          const parsed = JSON.parse(event.data.payload);
          if (parsed.type === "SHARE_EXTENSION_AUTH_TOKEN" && parsed.token) {
            addToDebugLog("Received auth token");
            token = parsed.token;
            await authenticateWithToken(parsed.token);
          }
        }
      }
    } catch (e: any) {
      logger.error(e);
    }
  }

  async function setLaunchContext() {
    try {
      const dapId = await getDapId();
      $context.dapId = dapId;
      $context.isStandaloneSheet = true;
    } catch (e) {
      logger.error(e);
    }
  }

  async function bootup() {
    await setLaunchContext();
    await account.init();
    if (await isSessionActive()) {
      addToDebugLog("User session already active");
      clearTokenCheckTimeout();
      error = undefined;
      await initializeDatafn();
    } else if (token) {
      addToDebugLog("Authenticating using URL param token");
      await authenticateWithToken(token);
    }
  }

  async function authenticateWithToken(token: string) {
    try {
      clearTokenCheckTimeout();
      error = undefined;
      if (await isSessionActive()) return;
      isAuthenticating = true;
      await account.embedOAuthSignin(token);
      if ($account.userId) await initializeDatafn();
    } catch (e: any) {
      addToDebugLog("Authentication failed");
      error = "Authentication failed";
    } finally {
      isAuthenticating = false;
    }
  }

  async function initializeDatafn() {
    try {
      const dapId = await getDapId();
      await initializeNucleumDatafn({
        product: $appStore.product,
        account: $account,
        dapId: dapId!,
        isOffline: $context.isInOfflineMode,
        env: import.meta.env.MODE
      });
      isInitialized = true;
    } catch (e: any) {
      addToDebugLog("Failed to initialize");
      error = "Failed to initialize";
    }
  }

  async function isSessionActive() {
    const token = await clientStorage.get(ClientStorageKey.AUTHFN_TOKEN);
    if (!token) return false;
    return performSessionExpiryCheck();
  }

  async function performSessionExpiryCheck() {
    let isSessionExpiredOrRefreshing = await account.checkIfSessionExpired();
    if (isSessionExpiredOrRefreshing) {
      error = "Session expired. Please open the app to login again.";
      return false;
    } else return true;
  }
</script>

<div
  id="base"
  class={cn(
    "text-base text-fgs1 bg-bgs1 relative w-screen h-screen flex",
    $appearance.theme,
    $appearance.colorScheme.tailwindSelector
  )}
>
  <ThemeLayer isSheetContext={true}>
    <SheetDebugLogs logs={debugLog} isShowLogs={false}>
      initialized: {isInitialized}
    </SheetDebugLogs>
    {#if error}
      <EmptyStatusView subText={error} size={Size.sm} />
    {:else if isInitialized}
      {@render children?.()}
    {:else}
      <EmptyStatusView isLoadingState={true} loadingText="Authenticating..." />
    {/if}
    <div id="popovers"></div>
    <div id="secondary-popovers"></div>
    <div id="tooltips"></div>
    <div id="toolbars"></div>
  </ThemeLayer>
</div>
<svelte:window onmessage={handleMessageFromParent} />
