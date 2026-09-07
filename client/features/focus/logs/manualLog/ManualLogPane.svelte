<script lang="ts">
  import { onMount } from "svelte";
  import ManualLogItem from "@nucleum/features/focus/logs/manualLog/ManualLogItem.svelte";
  import { postMessageToParent } from "@nucleum/client/runtime/embed/embed.utils";
  import { EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import { manualLogStore } from "@nucleum/features/focus/logs/log.store";

  onMount(() => {
    postMessageToParent(EmbedMessage.SHEET_MOUNTED);
    manualLogStore.reset();
    if ($manualLogStore.manualLogs.length === 0) {
      manualLogStore.addNew();
    }
  });
</script>

<div class="flex flex-col gap-6 w-full grow overflow-y-auto">
  <div class="flex flex-col gap-8 w-full mt-4">
    {#if $manualLogStore?.manualLogs && $manualLogStore.manualLogs.length > 0}
      {#each $manualLogStore.manualLogs as item}
        <ManualLogItem {item} />
      {/each}
    {/if}
  </div>
  <div class="flex w-full justify-center">
    <Button
      label="Add another entry"
      icon="plus"
      onclick={() => manualLogStore.addNew()}
    />
  </div>
</div>
