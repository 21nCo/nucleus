<svelte:options runes={true} />

<script lang="ts">
  import account from "@nucleum/stores/account.store";
  import { appStore } from "@nucleum/stores/app.store";
  import context from "@nucleum/stores/context.store";
  import { UserDataMode } from "@nucleum/client/runtime/account/account.type";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import { cn } from "@21n/utils/ui.utils";

  let { isInThinMode = false }: { isInThinMode?: boolean } = $props();
</script>

{#if $account.dataMode === UserDataMode.LOCAL || $context.isInOfflineMode}
  <button
    class={cn(
      "text-ass1 border border-dashed dark:border-ass2/50 border-ass2 hover:bg-ass2/10 rounded-md px-2 py-1 my-1",
      {
        "text-b4": isInThinMode,
        "text-b3": !isInThinMode
      }
    )}
    onclick={() => {
      if ($account.dataMode === UserDataMode.LOCAL) {
        appStore.runAction(Action.SETTINGS);
      } else {
        appStore.runAction(Action.SYNC_SETTINGS);
      }
    }}>{isInThinMode ? "Offline" : "Offline mode"}</button
  >
{/if}
