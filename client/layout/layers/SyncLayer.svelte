<svelte:options runes={true} />

<script lang="ts">
  import context from "@nucleum/stores/context.store";
  import {
    nucleumDatafnStatus,
    pullDatafnNow,
    refreshNucleumDatafnStatus
  } from "@nucleum/datafn/datafn.store";
  import { onMount, onDestroy } from "svelte";
  let isSyncing = $state(false);
  let isDestroyed = false;
  let lastSyncTimestamp = 0;
  let visibilityDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  let currentSyncTimeout: ReturnType<typeof setTimeout> | null = null;

  const MIN_SYNC_GAP = 2000;
  const VISIBILITY_DEBOUNCE = 1000;
  const MAX_SYNC_DURATION = 30000;

  onMount(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });

  onDestroy(() => {
    isDestroyed = true;

    if (visibilityDebounceTimeout) {
      clearTimeout(visibilityDebounceTimeout);
      visibilityDebounceTimeout = null;
    }

    if (currentSyncTimeout) {
      clearTimeout(currentSyncTimeout);
      currentSyncTimeout = null;
    }

    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  async function proceedSync() {
    if (isDestroyed || isSyncing) return;
    if ($context.isInOfflineMode) return;
    if ($nucleumDatafnStatus.nucleumMode !== "sync") return;

    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_GAP) return;

    isSyncing = true;
    lastSyncTimestamp = now;

    let syncCompleted = false;
    currentSyncTimeout = setTimeout(() => {
      if (!syncCompleted && !isDestroyed) {
        console.warn(
          "Sync operation exceeded",
          MAX_SYNC_DURATION,
          "ms - may be hung"
        );
      }
    }, MAX_SYNC_DURATION);

    try {
      await pullDatafnNow();
      await refreshNucleumDatafnStatus();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      syncCompleted = true;
      if (currentSyncTimeout) {
        clearTimeout(currentSyncTimeout);
        currentSyncTimeout = null;
      }

      if (!isDestroyed) {
        isSyncing = false;
      }
    }
  }

  function handleVisibilityChange() {
    if (isDestroyed) return;

    if (!document.hidden) {
      if (visibilityDebounceTimeout) {
        clearTimeout(visibilityDebounceTimeout);
      }
      visibilityDebounceTimeout = setTimeout(() => {
        if (!isDestroyed) {
          proceedSync();
        }
      }, VISIBILITY_DEBOUNCE);
    }
  }
</script>
