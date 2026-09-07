<script lang="ts">
  import { fileLoaderv2 } from "@nucleum/actions/lazyload.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { Arrangement } from "@21n/elements/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { isValidUrl } from "@21n/shared-utils/utils";
  import { resolveFallbackIconForUrl } from "@nucleum/features/memory/node/node.utils";
  let {
    src,
    arrangement = undefined,
    isApplyBgColor = false,
    class: classList = "",
    onLoad = undefined
  }: {
    src: string;
    arrangement?: Arrangement | undefined;
    isApplyBgColor?: boolean;
    class?: string;
    onLoad?: ((event: Event) => void) | undefined;
  } = $props();

  function handleImageError(event: Event) {
    const target = event.currentTarget as HTMLImageElement;
    target.style.display = "none";
    target.nextElementSibling?.classList.remove("hidden");
  }
</script>

<img
  alt="..."
  class={classList}
  use:fileLoaderv2={{ source: src, isApplyBgColorFromImage: isApplyBgColor }}
  onload={onLoad}
  onerror={handleImageError}
/>
<div
  class={cn("hidden w-full h-full bg-bgs3 flex items-center justify-center", {
    "absolute inset-0 rounded-t-md": arrangement === Arrangement.GRID,
    "py-2": arrangement === Arrangement.MASONRY
  })}
>
  <Icon
    icon={src && isValidUrl(src) ? resolveFallbackIconForUrl(src) : "globe"}
  />
</div>
