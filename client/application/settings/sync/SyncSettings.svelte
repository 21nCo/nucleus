<script lang="ts">
  import InlineInfoBanner from "@21n/elements/text/InlineInfoBanner.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import context from "@nucleum/stores/context.store";
  import { Size } from "@21n/elements/size.enum";
  import SyncStatus from "@nucleum/application/settings/sync/SyncStatus.svelte";
  import account from "@nucleum/stores/account.store";
  import { PlanType } from "@nucleum/schema/account/subscription";
  import { appStore } from "@nucleum/stores/app.store";
  import {
    nucleumDatafnStatus,
    initializeNucleumDatafn,
    resolveDatafnOfflinabilityPreference,
    setDatafnOfflinabilityPreference,
    updateNucleumDatafnConnectivity
  } from "@nucleum/datafn/datafn.store";
  import { datafnE2eeState } from "@nucleum/datafn/datafnE2ee.store";
  import { getDapId } from "@nucleum/persistence/persistence.utils";
  import { UserDataMode } from "@nucleum/client/runtime/account/account.type";
  import { onMount } from "svelte";
  let isInOfflineMode = $state(false);
  let isOfflinabilityEnabled = $state(true);
  let isOfflinabilityInitialized = $state(false);
  let isSwitchingOfflinability = $state(false);
  let isNetworkInducedOfflineMode = $state(!navigator.onLine);
  const isLocalDataMode = $derived($account.dataMode === UserDataMode.LOCAL);
  const isOfflinabilityToggleDisabled = $derived(
    isNetworkInducedOfflineMode ||
      isInOfflineMode ||
      isLocalDataMode ||
      $datafnE2eeState.enabled ||
      !isOfflinabilityInitialized ||
      isSwitchingOfflinability
  );
  const trialExpiry = $derived(
    $account.plan?.plan === PlanType.TRIAL && $account.plan?.trialPlan?.expiry
      ? new Date($account.plan.trialPlan.expiry)
      : null
  );
  const isTrialExpired = $derived(
    trialExpiry ? new Date() > trialExpiry : false
  );

  $effect(() => {
    isInOfflineMode = $context.isInOfflineMode;
    if ($datafnE2eeState.enabled) isOfflinabilityEnabled = true;
  });

  onMount(() => {
    const refreshNetworkState = () => {
      isNetworkInducedOfflineMode = !navigator.onLine;
    };
    window.addEventListener("online", refreshNetworkState);
    window.addEventListener("offline", refreshNetworkState);
    void resolveDatafnOfflinabilityPreference()
      .then((value) => {
        isOfflinabilityEnabled = $datafnE2eeState.enabled ? true : value;
      })
      .catch(() => undefined)
      .finally(() => {
        isOfflinabilityInitialized = true;
      });
    return () => {
      window.removeEventListener("online", refreshNetworkState);
      window.removeEventListener("offline", refreshNetworkState);
    };
  });

  async function handleOfflinabilityChange() {
    const nextValue = !isOfflinabilityEnabled;
    if (!nextValue && $nucleumDatafnStatus.pendingChanges > 0) {
      window.alert(
        "Please sync pending changes before turning off offline availability."
      );
      return;
    }
    isSwitchingOfflinability = true;
    try {
      isOfflinabilityEnabled = nextValue;
      await setDatafnOfflinabilityPreference(nextValue);
      const dapId = await getDapId();
      await initializeNucleumDatafn({
        product: $appStore.product,
        account: $account,
        env: $appStore.env,
        appVersion: $appStore.version + "." + $appStore.build,
        dapId: dapId ?? undefined,
        isOffline: $context.isInOfflineMode,
        isOfflinabilityEnabled: nextValue
      });
    } catch {
      isOfflinabilityEnabled = !nextValue;
      await setDatafnOfflinabilityPreference(!nextValue);
      const dapId = await getDapId();
      await initializeNucleumDatafn({
        product: $appStore.product,
        account: $account,
        env: $appStore.env,
        appVersion: $appStore.version + "." + $appStore.build,
        dapId: dapId ?? undefined,
        isOffline: $context.isInOfflineMode,
        isOfflinabilityEnabled: !nextValue
      }).catch(() => undefined);
      window.alert("Unable to change offline availability. Please try again.");
    } finally {
      isSwitchingOfflinability = false;
    }
  }
</script>

<div class="flex flex-col gap-4">
  <SwitchInput
    label={{
      label: "Turn on offline mode"
    }}
    isExpanded={true}
    checked={isInOfflineMode}
    isDisabled={isNetworkInducedOfflineMode}
    onChange={async () => {
      if (isTrialExpired && isInOfflineMode) {
        window.alert(
          "Your trial has expired. Please upgrade to a paid plan to continue using cloud sync."
        );
        return;
      }
      const previousValue = isInOfflineMode;
      const nextValue = !previousValue;
      await context.toggleOfflineMode(nextValue);
      isInOfflineMode = $context.isInOfflineMode;
      try {
        await updateNucleumDatafnConnectivity($context.isInOfflineMode);
      } catch {
        await context.toggleOfflineMode(previousValue);
        isInOfflineMode = $context.isInOfflineMode;
        await updateNucleumDatafnConnectivity(previousValue).catch(
          () => undefined
        );
        window.alert("Unable to change offline mode. Please try again.");
      }
    }}
  />
  <InlineInfoBanner
    content="Note: Offline mode will be automatically turned on when you are not connected to the internet or if your cloud sync trial expires."
    size={Size.sm}
  />
  <SwitchInput
    label={{
      label: "Keep data available offline"
    }}
    isExpanded={true}
    checked={isOfflinabilityEnabled}
    isDisabled={isOfflinabilityToggleDisabled}
    onChange={handleOfflinabilityChange}
  />
  <InlineInfoBanner
    content="When this is off, this device reads and writes directly through cloud sync and does not keep a local IndexedDB copy for offline use."
    size={Size.sm}
  />
  <div class="flex w-full justify-center mt-8">
    <SyncStatus />
  </div>
</div>
