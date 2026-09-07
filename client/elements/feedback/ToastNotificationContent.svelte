<script lang="ts">
  import { renderMdAsHtml } from "@nucleum/features/memory/markdown/markdown.utils";
  import { AlertType, type Toast } from "@21n/types/notification.type";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "../Icon.svelte";

    let {
    notification,
  }: {
    notification: Toast;
  } = $props();

</script>

<div class="flex gap-2 items-center" data-testid="toast-notification-content">
  {#if notification.type === AlertType.PROGRESS}
    <Icon icon="svg-spinners:90-ring-with-bg" class="stroke-bgs1" />
  {:else}
    <span
      class={cn("h-2 w-2 rounded-full min-w-1 shrink-0", {
        "bg-ags1": notification.type === AlertType.SUCCESS,
        "bg-ars1": notification.type === AlertType.ERROR,
        "bg-ass1": notification.type === AlertType.WARNING
      })}
    />
  {/if}
  {#if notification.title}
    <span
      class={cn({
        "font-semibold": notification.message,
        "text-b2": !notification.message
      })}
    >
      {notification.title}
    </span>
  {/if}
  <span class="text-b2">
    {@html renderMdAsHtml(notification?.message ?? "")}
  </span>
</div>
