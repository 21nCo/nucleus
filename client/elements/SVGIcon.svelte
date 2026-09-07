<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  let {
    icon = null,
    size = Size.lg,
    phIconSize = Size.sm,
    isRenderRaw = false,
    isAccentBg = false,
    onclick = void 0
  }: any = $props();
  const tailwindSizes: any = {
    xxs: "w-2 h-2",
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-[1.25rem] h-[1.25rem]",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
    xxl: "w-10 h-10",
    "5xl": "w-16 h-full",
    fit: "w-fit h-fit"
  };

  function importIcon(icon: string) {
    return import(`../SVGIcons/${icon}.svg?raw`);
  }
</script>

{#if icon?.includes("ph:")}
  <Icon {icon} size={phIconSize} class={isAccentBg ? "text-bgs1" : ""} />
{:else if size === "fit" && icon}
  {#await importIcon(icon)}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" />
  {:then mod}
    {@html mod.default}
  {/await}
{:else if icon && !isRenderRaw}
  {#if onclick}
    <button {onclick} class={cn(tailwindSizes[size])}>
      {#await importIcon(icon)}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" />
      {:then mod}
        {@html mod.default}
      {/await}
    </button>
  {:else}
    <span class={cn("inline-flex", tailwindSizes[size])} aria-hidden="true">
      {#await importIcon(icon)}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" />
      {:then mod}
        {@html mod.default}
      {/await}
    </span>
  {/if}
{:else if icon && isRenderRaw}
  {#await importIcon(icon)}
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" />
  {:then mod}
    {@html mod.default}
  {/await}
{/if}
