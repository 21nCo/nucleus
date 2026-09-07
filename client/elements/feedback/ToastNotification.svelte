<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import { tweened } from "svelte/motion";
  import {
    toastDefaultDuration,
    toasts
  } from "@nucleum/stores/notification.store";
  import { AlertType, type Toast } from "@21n/types/notification.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { linear } from "svelte/easing";
  import { onMount } from "svelte";
  import { renderMdAsHtml } from "@nucleum/components/markdown/markdown.utils";
    let {
    notification,
    isShownAsModal = false,
  }: {
    notification: Toast;
    isShownAsModal?: boolean;
  } = $props();

  


  const progress = tweened(100, {
    duration: toastDefaultDuration,
    easing: linear
  });
  function stopPropagation(event: Event) {
    event.stopPropagation();
  }
  function close(event: MouseEvent) {
    toasts.reset();
    event.stopPropagation();
  }
  onMount(() => {
    progress.set(0);
  });
</script>

<!-- TODO - use snippets in Svlete 5 to reuse markup -->
{#if isShownAsModal}
  <div class="flex flex-col w-full gap-4 items-center">
    <div
      class="h-2 w-full rounded-full {notification.type === AlertType.SUCCESS
        ? 'bg-ags1'
        : 'bg-ars1'}"
    ></div>
    <div class="flex flex-col gap-2">
      {#if notification.title}
        <div class="text-fgs2 font-bold">{notification.title}</div>
      {/if}
      {notification.message}
    </div>
  </div>
{:else}
  <div
    class={cn(
      "relative flex gap-2 bg-fgs1 text-bgs1 shadow-md text--fgs2 items-center portrait:flex-1 portrait:min-w-0 portrait:mx-4 portrait:w-4/5 pr-2 rounded-md",
      {
        "min-h-20 h-20": notification.message && notification.title,
        "min-h-12 h-12": !notification.message || !notification.title,
        "w-96": notification.type !== AlertType.PROGRESS,
        "w-fit": notification.type === AlertType.PROGRESS
      }
    )}
    onclick={stopPropagation}
    onkeydown={stopPropagation}
  >
    <div
      class={cn("h-3/4 rounded-full min-w-1 shrink-0", {
        "bg-ags1": notification.type === AlertType.SUCCESS,
        "bg-ars1": notification.type === AlertType.ERROR,
        "bg-ass1": notification.type === AlertType.WARNING
      })}
    />
    <div
      class={cn("flex h-full items-center min-w-0 flex-1", {
        "gap-4": notification.type !== AlertType.PROGRESS,
        "gap-1 justify-center": notification.type === AlertType.PROGRESS
      })}
    >
      <span class="flex items-center justify-center">
        {#if notification.type === AlertType.PROGRESS}
          <Icon icon="svg-spinners:90-ring-with-bg" class="stroke-bgs1" />
        {/if}
      </span>
      <div class="flex flex-col gap-2 items-start truncate">
        {#if notification.title}
          <div
            class={cn("text-bgs2", {
              "font-semibold": notification.message,
              "text-b2": !notification.message
            })}
          >
            {notification.title}
          </div>
        {/if}
        {#if notification.message}
          <div
            class={cn({
              "text-b3": notification.title,
              "text-b2": !notification.title
            })}
          >
            {@html renderMdAsHtml(notification.message)}
          </div>
        {/if}
      </div>
    </div>
    <div class="flex gap-2 items-center">
      {#if notification.actionText}
        <button
          type="button"
          onclick={(event) => {
            event.stopPropagation();
            notification.callback?.();
          }}
          class="bg-fgs2 rounded-full px-2 py-1 text-b3"
        >
          {notification.actionText}
        </button>
      {/if}
      {#if !notification.isNonDismissable && notification.type !== AlertType.PROGRESS}
        <div
          class="flex items-center justify-center hover:bg-fgs3 rounded-md"
          onclick={close}
        >
          <Icon icon="cross" class="stroke-bgs1" />
        </div>
      {/if}
    </div>
    {#if !notification.isNonDismissable && notification.type !== AlertType.PROGRESS}
      <div
        class="absolute bottom-0 left-0 w-full portrait:mx-4 portrait:w-4/5 h-1 bg-fgs1 rounded-b-md"
      >
        <div
          class="h-full transition-all duration-100 ease-linear bg-fgs3 rounded-bl-md"
          style="width: {$progress}%;"
        ></div>
      </div>
    {/if}
  </div>
{/if}
