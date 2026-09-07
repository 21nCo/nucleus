<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import type { CollectionItem } from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/types";
  let {
    item,
    currentUrl
  }: {
    item: CollectionItem;
    currentUrl: string;
  } = $props();

  let isActive = $derived(currentUrl === item.url);

  function getFaviconUrl(url?: string): string | null {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  }

  function handleImageError(event: Event) {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.style.display = "none";
    }
  }
</script>

<button
  class={cn(
    "flex items-start w-full gap-3 p-3 rounded-lg cursor-pointer group border",
    {
      "bg-aps3 border-aps1": isActive,
      "hover:bg-bgs2 border-transparent": !isActive
    }
  )}
  onclick={(e) => {
    if (!item.url) return;
    if (e.metaKey || e.ctrlKey) {
      window.open(item.url, "_blank");
    } else {
      chrome.tabs.update({ url: item.url });
    }
  }}
>
  <div class="flex-shrink-0 mt-1">
    {#if getFaviconUrl(item.url)}
      <img
        src={getFaviconUrl(item.url)}
        alt="favicon"
        class="w-4 h-4 rounded"
        onerror={handleImageError}
      />
    {:else}
      <Icon icon="globe" size={Size.sm} />
    {/if}
  </div>
  {#if item.contentType === NodeType.TWEET}
    <div class="flex flex-col items-start w-full">
      <span class="text-left text-b2 line-clamp-3">
        {item.body.content ?? "No text available"}
      </span>
      {#if item.parent}
        <div class="text-fgs3 text-b3 mt-1 truncate">
          @{item.parent.split("twitterProfile_")[1]}
        </div>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col items-start flex-1 min-w-0">
      <div
        class={cn(
          "text-left font-medium text-b2 line-clamp-1 transition-colors",
          {
            "text-fgs2 group-hover:text-fgs1": !isActive,
            "text-aps1": isActive,
            "text-fgs3": !isActive && !item.url
          }
        )}
      >
        {item.label}
      </div>
      {#if item.url}
        <div class="text-fgs3 text-b3 mt-1 truncate">
          {new URL(item.url).hostname}
        </div>
      {/if}
    </div>
  {/if}
</button>

<style>
  .line-clamp-1 {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
