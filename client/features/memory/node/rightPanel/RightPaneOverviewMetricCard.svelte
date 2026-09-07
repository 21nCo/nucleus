<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";

  let {
    label,
    value,
    icon,
    onclick = undefined
  }: {
    label: string;
    value: number;
    icon: string;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class="flex items-center justify-center gap-1 hover:bg-bgs2 px-4 h-full"
  {onclick}
>
  <Icon {icon} size={Size.sm} />
  <span class="flex flex-row gap-1 items-center text-fgs2 text-b2">
    {label}:
    {value}
  </span>
</button>
