<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";

  let {
    icon,
    label,
    isBoxed = false,
    onclick = undefined
  }: {
    icon: string;
    label: string;
    isBoxed?: boolean;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class={cn("relative flex flex-col items-center justify-center gap-2 h-24", {
    "notouch:hover:bg-bgs2 active:bg-bgs2 bg-bgs1": isBoxed,
    "p-3 bg-bgs1 rounded-md": !isBoxed
  })}
  {onclick}
>
  <Icon {icon} size={Size.lg} class="text-fgs2" />
  <span class="text-fgs2 text-b3 line-clamp-1">{label}</span>
</button>
