<script lang="ts">
  import type { Snippet } from "svelte";
  import { appearance } from "@nucleum/stores/appearance.store";
  import ThemeLayer from "@21n/layout/layers/themeLayer/ThemeLayer.svelte";
  import { cn } from "@21n/utils/ui.utils";

  let {
    id,
    isInlineExtensionContext = false,
    children
  }: {
    id: string;
    isInlineExtensionContext?: boolean;
    children?: Snippet;
  } = $props();

  let classList: string = "";
  export { classList as class };
</script>

<div
  {id}
  class={cn(
    "text-base text-fgs1 relative",
    classList,
    $appearance.theme,
    $appearance.colorScheme.tailwindSelector
  )}
  onkeydown={(event) => {
    event.stopPropagation();
  }}
  onkeyup={(event) => {
    event.stopPropagation();
  }}
>
  <ThemeLayer extensionContext={id} {isInlineExtensionContext}>
    {@render children?.()}
    <div id="popovers"></div>
    <div id="secondary-popovers"></div>
    <div id="tooltips"></div>
  </ThemeLayer>
</div>
<svelte:head>
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Color+Emoji+Compat&display=swap"
    rel="stylesheet"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
    rel="stylesheet"
  />
</svelte:head>
