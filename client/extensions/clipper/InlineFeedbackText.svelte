<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import {
    AlertType,
    type IInlineStatus
  } from "@nucleum/stores/notifications/notification.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    feedback = $bindable(),
    isRenderEmptyHeight = false,
    isAutoDissappear = true,
    size = Size.md
  }: {
    feedback?: IInlineStatus | string | undefined;
    isRenderEmptyHeight?: boolean;
    isAutoDissappear?: boolean;
    size?: Size.md | Size.sm;
  } = $props();
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    clearTimeout(timer);
    if (!(feedback && isAutoDissappear)) return;
    timer = setTimeout(() => {
      feedback = undefined;
    }, 4000);
    return () => {
      clearTimeout(timer);
    };
  });
</script>

{#if feedback}
  <div
    class={cn("flex items-center gap-1 w-full justify-center h-4", {
      "text-fgs3": typeof feedback === "string",
      "text-ags1":
        typeof feedback != "string" && feedback?.type === AlertType.SUCCESS,
      "text-ars1":
        typeof feedback != "string" && feedback?.type === AlertType.ERROR,
      "text-b2": size === Size.md,
      "text-b3": size === Size.sm
    })}
  >
    {#if typeof feedback === "object"}
      {#if feedback?.type === AlertType.PROGRESS}
        <Icon icon="svg-spinners:90-ring-with-bg" size={Size.xs} />
      {:else if feedback?.type === AlertType.SUCCESS}
        <Icon icon="ph:check-circle" size={Size.xs} class="text-ags1" />
      {:else if feedback?.type === AlertType.ERROR}
        <Icon icon="ph:x-circle" size={Size.xs} class="text-ars1" />
      {/if}
    {/if}
    <span>
      {typeof feedback == "string" ? feedback : feedback.message}
    </span>
  </div>
{:else if isRenderEmptyHeight}
  <div class="h-4"></div>
{/if}
