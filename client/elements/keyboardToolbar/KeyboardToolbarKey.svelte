<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    icon,
    isApplySystemColors = false,
    onclick = undefined
  }: {
    icon: string;
    isApplySystemColors?: boolean;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class={cn(
    "flex items-center justify-center rounded-md p-1 h-[42px] w-[34px] min-w-[34px] min-h-[42px] click:bg-fgs4 shadow-sm",
    {
      "bg-white dark:bg-[#6b6b6b]": isApplySystemColors,
      "bg-bgs3 active:bg-bgs4": !isApplySystemColors
    }
  )}
  {onclick}
  onmousedown={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
>
  <Icon {icon} size={Size.sm} />
</button>
