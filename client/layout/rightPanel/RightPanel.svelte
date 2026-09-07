<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import ComponentResolver from "../paint/ComponentResolver.svelte";
  import type { IAction } from "@21n/types/action.type";
  import { Size } from "@21n/types/size.enum";
  import context from "@nucleum/stores/context.store";
  import { fly } from "svelte/transition";
  import { quadInOut } from "svelte/easing";
  let { action }: { action: IAction } = $props();
</script>

<div
  class={cn(
    "flex justify-center items-center h-full bg-bgs2 transition-all duration-300",
    {
      "min-w-96 w-96 2k:min-w-128 2k:w-128":
        action.liveActionParams?.size === Size.sm,
      "min-w-[32rem] w-[32rem] 2k:min-w-1/2 2k:w-1/2":
        !action.liveActionParams?.size ||
        action.liveActionParams?.size === Size.md,
      "min-w-[36rem] w-[36rem] 2k:min-w-1/2 2k:w-1/2":
        action.liveActionParams?.size === Size.lg,
      "min-w-1/2 w-1/2 2k:min-w-1/2 2k:w-1/2":
        action.liveActionParams?.size === Size.xl,
      "border-r border-brs3": !$context.experiments?.isEnableRoundedMain
    }
  )}
  in:fly={{ x: -10, duration: 100, easing: quadInOut }}
>
  <ComponentResolver {action} />
</div>
