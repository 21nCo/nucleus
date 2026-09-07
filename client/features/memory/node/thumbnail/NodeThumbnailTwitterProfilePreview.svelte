<script lang="ts">
  import { fileLoaderv2 } from "@nucleum/actions/lazyload.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  let { src }: { src: string } = $props();

  function handleImageError(event: Event) {
    const target = event.currentTarget as HTMLImageElement;
    target.style.display = "none";
    target.nextElementSibling?.classList?.remove("hidden");
  }
</script>

<div
  class="absolute inset-0 w-full h-full flex justify-center items-center rounded-t-md"
>
  <img
    use:fileLoaderv2={{
      source: src,
      isApplyBgColorFromImage: true,
      isApplyBgColorToParent: true
    }}
    class="w-12 h-12 rounded-full"
    alt="..."
    onerror={handleImageError}
  />
  <div class={cn("hidden w-full h-full flex items-center justify-center", {})}>
    <Icon icon="x-logo" />
  </div>
</div>
