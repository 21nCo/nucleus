<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type { IBlockBrowserItem } from "@nucleum/features/memory/markdown/blockBrowser/blockBrowser.type";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/elements/direction.enum";
  import MdShortcutText from "@nucleum/features/memory/markdown/shortcuts/MdShortcutText.svelte";

  let {
    block,
    width = "w-full",
    isFocused = false,
    onSelect = undefined
  }: {
    block: IBlockBrowserItem;
    width?: string;
    isFocused?: boolean;
    onSelect?: ((event: CustomEvent<IBlockBrowserItem>) => void) | undefined;
  } = $props();
  let ref = $state<HTMLElement>();
  let hasSelected = false;
  $effect(() => {
    if (isFocused && ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  });

  function selectBlock() {
    if (block.isDisabled || hasSelected) return;
    hasSelected = true;
    const event = new CustomEvent<IBlockBrowserItem>("select", {
      detail: block
    });
    onSelect?.(event);
  }
</script>

<button
  bind:this={ref}
  class={cn(
    "flex items-center gap-3 text-b2 hover:bg-bgs2 p-2 rounded-md",
    width,
    {
      "bg-bgs2": isFocused,
      "opacity-70 cursor-not-allowed": block.isDisabled
    }
  )}
  onpointerdown={(event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    selectBlock();
  }}
  onclick={(event) => {
    event.stopPropagation();
    selectBlock();
  }}
  use:tooltip={{
    disabled: !block.tooltip,
    text: block.tooltip,
    direction: Placement.Bottom
  }}
>
  <div
    class="bg-bgs2 rounded-md p-1 border border-brs3 flex justify-center items-center"
  >
    <Icon icon={block.icon} />
  </div>
  <div class="text-left">{block.label}</div>
  <span class="ml-auto">
    {#if block.badge}
      <Badge text={block.badge} />
    {:else if block.isShowShortcut}
      <span class="text-b3 text-fgs3">
        <MdShortcutText type={block.type} />
      </span>
    {/if}
  </span>
</button>
