<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import type { LinkThumbnail } from "@nucleum/features/memory/node/node.type";
  import { cn } from "@21n/utils/ui.utils";
  let {
    link,
    context,
    onRemove = undefined
  }: {
    link: LinkThumbnail;
    context: "capture" | "nodethumbnail" | "nodepage";
    onRemove?: ((link: LinkThumbnail) => void) | undefined;
  } = $props();
  let isHovering = $state(false);
</script>

<span
  onpointerenter={() => (isHovering = true)}
  onpointerleave={() => (isHovering = false)}
  class={cn(
    "relative flex items-center gap-1 border border-brs3 rounded-full min-w-fit",
    {
      "py-1 px-6": context === "capture",
      "px-4": context !== "capture"
    }
  )}
>
  {link.label}
  {#if isHovering && !(context === "nodethumbnail")}
    <div
      class="absolute right-0 rounded-full bg-gradient-to-l from-bgs2 via-bgs2 to-transparent pr-2 pl-10 flex h-full items-center"
    >
      <Icon
        icon="cross"
        onclick={() => {
          onRemove?.(link);
        }}
      />
    </div>
  {/if}
</span>
