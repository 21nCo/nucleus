<script lang="ts">
  import context from "@nucleum/stores/context.store";
  import account from "@nucleum/stores/account.store";
  import view from "@nucleum/stores/view.store";
  import { UserDataMode } from "@21n/types/account.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { appStore } from "@nucleum/stores/app.store";
  import { Action } from "@21n/types/action.enum";

  let {
    isIconOnly = false,
  }: {
    isIconOnly?: boolean;
  } = $props();

  function onClick() {
    appStore.runAction(Action.OFFLINE_STATUS);
  }

  const label = $derived(
    !$context.isEmbed && $account.dataMode === UserDataMode.LOCAL
      ? "Data warning"
      : "Offline"
  );
</script>

{#if $context.isInOfflineMode || $account.dataMode === UserDataMode.LOCAL}
  {#if isIconOnly}
    <button
      type="button"
      class="flex items-center gap-1 p-1 rounded-md hover:bg-ass2/10"
      aria-label={label}
      title={label}
      onclick={onClick}
    >
      <Icon icon="offline" class="text-ass1" />
    </button>
  {:else}
    <button
      type="button"
      class="flex items-center gap-1 text-ass1 px-1.5 py-0.5 text-b3 border border-dashed dark:border-ass1/50 border-ass1 hover:bg-ass2/10 rounded-md"
      onclick={onClick}
    >
      <Icon icon="offline" class="text-ass1" size={Size.sm} />
      {label}
    </button>
  {/if}
{/if}
