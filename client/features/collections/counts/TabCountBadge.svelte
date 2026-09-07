<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";

  let {
    count = 0,
    isActive = false,
    hasCustomColor = false
  }: {
    count?: number;
    isActive?: boolean;
    hasCustomColor?: boolean;
  } = $props();

  let displayCount = $derived(count > 99 ? "99+" : count.toString());
</script>

<span
  class={cn(
    "flex items-center justify-center rounded-full px-1.5 min-w-[20px] text-b3",
    !hasCustomColor && {
      "bg-bgs3 text-fgs2": !isActive,
      "bg-aps1 text-abg": isActive
    },
    hasCustomColor && {
      "bg-ccs2 text-abg": isActive,
      "bg-ccs4 text-ccs1": !isActive
    }
  )}
>
  {displayCount}
</span>
