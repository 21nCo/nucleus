<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  let {
    color,
    isActive = false,
    isMemory = false
  }: {
    color: string;
    isActive?: boolean;
    isMemory?: boolean;
  } = $props();
</script>

<div
  class={cn("rounded-full", {
    "w-1.5 h-1.5 border-[0.5px] border-brs2": isActive,
    "w-1 h-1": !isActive,
    [`bg-${color}`]: !isMemory,
    border: isMemory,
    "border-fgs3": !isActive && isMemory
  })}
></div>
