<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";

  let {
    count = 0,
    label = undefined,
    icon = undefined
  }: {
    count?: number;
    label?: string | undefined;
    icon?: string | undefined;
  } = $props();
  let fullLabel = $derived(
    `${count > 99 ? "99+" : count.toString()}${label ? ` ${label}` : ""}`
  );
</script>

<span
  class="flex items-center justify-center gap-1 px-1 py-0.5 rounded-md bg-bgs3 min-w-6"
>
  {#if icon}
    <Icon {icon} size={Size.sm} class="stroke-fgs3" />
  {/if}
  <span class="text-b3 text-fgs2">{fullLabel}</span>
</span>
