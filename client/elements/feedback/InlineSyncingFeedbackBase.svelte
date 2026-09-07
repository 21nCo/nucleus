<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import { scale } from "svelte/transition";
  import { bounceIn, bounceOut } from "svelte/easing";

    let {
    isShorter = false,
    text = undefined,
    padding = "",
    isSyncing = false,
    isDisableOutTransition = false,
  }: {
    isShorter?: boolean;
    text?: string | undefined;
    padding?: string;
    isSyncing?: boolean;
    isDisableOutTransition?: boolean;
  } = $props();

  
  
  
  
  /**
   * out: transition interfering issue with TopNav transitions hence duration is used as 1 ms
   */
  const outTransitionDuration = isShorter || isDisableOutTransition ? 1 : 200;
  if (!text && !isShorter) text = "Syncing...";
</script>

<span
  class={cn("flex items-center gap-2", padding, {
    "text-fgs2 px-1": isShorter,
    "text-aps1": !isShorter,
    "w-full justify-center py-2 bg-aps3 rounded-md": !isShorter
  })}
  class:hidden={!isSyncing}
  in:scale={{ duration: 200, easing: bounceIn }}
  out:scale={{ duration: outTransitionDuration, easing: bounceOut }}
>
  <Icon
    icon={isShorter
      ? "svg-spinners:bars-rotate-fade"
      : "svg-spinners:3-dots-fade"}
    size={Size.sm}
    class={isShorter ? "text-fgs2" : "text-aps1"}
  />
  {#if text}
    <span class="text-b3"> {text} </span>
  {/if}
</span>
