<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { onMount } from "svelte";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { lazyLoad } from "@nucleum/actions/lazyload.action";
  import { cn } from "@21n/utils/ui.utils";
  import {
    resolveFallbackIconForUrl,
    resolveNodeFavicon,
    type INodeFaviconSource
  } from "@nucleum/features/memory/node/node.utils";
  import { isValidUrl } from "@21n/shared-utils/utils";
  let {
    node,
    size = Size.md
  }: {
    node: INodeFaviconSource;
    size?: Size.sm | Size.md | Size.lg;
  } = $props();
  let favicon: string | undefined = undefined;
  onMount(() => {
    favicon = resolveNodeFavicon(node);
  });
</script>

<span class="shrink-0 flex items-center justify-center">
  {#if node.contentType === NodeType.WEB_TEXT_BOOKMARK}
    <Icon icon="highlighter-circle" {size} />
  {:else if node.contentType === NodeType.WEB_SCREENSHOT}
    <Icon icon="crop" {size} />
  {:else if node.contentType === NodeType.KINDLE_HIGHLIGHT}
    <Icon icon="book-open" {size} />
  {:else if favicon && isValidUrl(favicon)}
    <img
      use:lazyLoad={favicon}
      alt="favicon"
      class={cn("rounded-full", {
        "w-4 h-4": size === Size.sm,
        "w-5 h-5": size === Size.md,
        "w-6 h-6": size === Size.lg
      })}
    />
  {:else}
    <Icon icon={resolveFallbackIconForUrl(node.url ?? "")} {size} />
  {/if}
</span>
