<script lang="ts">
  import appearance from "@nucleum/stores/appearance.store";
  import {
    generateCustomColorShades,
    resolveIfActiveFgFg,
    retrieveCurrentColors
  } from "@21n/utils/theme.utils";
  let {
    type = "div",
    id = "",
    role = undefined,
    color = undefined,
    class: classList = "w-full h-full",
    style: styles = "",
    onclick = undefined,
    children
  }: {
    type?: string;
    id?: string;
    role?: string | undefined;
    color?: number | undefined;
    class?: string;
    style?: string;
    onclick?: ((event: MouseEvent) => void) | undefined;
    children?: import("svelte").Snippet;
  } = $props();
  const customColorShades = $derived(
    color != undefined ? generateCustomColorShades($appearance, color) : []
  );
  const isActiveFgFg = $derived(resolveIfActiveFgFg(color, $appearance));
  const currentColors = $derived(retrieveCurrentColors($appearance));
</script>

<svelte:element
  this={type}
  {id}
  role={role ?? (type === "button" ? undefined : "button")}
  tabindex={type === "button" ? undefined : 0}
  class={classList}
  onclick={(event) => {
    onclick?.(event);
  }}
  style:--customcolor={customColorShades[0]}
  style:--customcolorshadetwo={customColorShades[1]}
  style:--customcolorshadethree={customColorShades[2]}
  style:--customcolorshadefour={customColorShades[3]}
  style:--customcolorshadefive={customColorShades[4]}
  style:--fgwhencustombg={isActiveFgFg
    ? currentColors.fgs1
    : currentColors.bgs1}
  style={styles}
>
  {@render children?.()}
</svelte:element>

<style>
  /* Note: rgba() doesn't work in Chrome extension sidePanel */
  :global(.fill-cbg) {
    fill: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.stroke-cbg) {
    stroke: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.text-cbg) {
    color: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.border-cbg) {
    border-color: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.bg-ccs1) {
    background-color: var(--customcolor, rgb(var(--colors-aps1)));
    color: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.bg-ccs2) {
    background-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.bg-ccs3) {
    background-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.bg-ccs4) {
    background-color: var(--customcolorshadefour, rgb(var(--colors-aps3)));
  }
  :global(.bg-ccs5) {
    background-color: var(--customcolorshadefive, rgb(var(--colors-aps3)));
  }
  :global(.border-ccs1) {
    border-color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.border-ccs2) {
    border-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.border-ccs3) {
    border-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.border-ccs4) {
    border-color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.text-ccs1) {
    color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.text-ccs1-fgs1) {
    color: var(--customcolor, rgb(var(--colors-fgs1)));
  }
  :global(.text-ccs2) {
    color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.text-ccs3) {
    color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.text-ccs4) {
    color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.fill-ccs1) {
    fill: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.stroke-ccs1) {
    stroke: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.transition-ease) {
    transition: background-color 0.3s ease-in-out;
  }

  :global(.hover\:bg-ccs1:hover) {
    background-color: var(--customcolor, rgb(var(--colors-aps1)));
    color: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.hover\:bg-ccs2:hover) {
    background-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.hover\:bg-ccs3:hover) {
    background-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.hover\:bg-ccs4:hover) {
    background-color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.hover\:bg-ccs5:hover) {
    background-color: var(--customcolorshadefive, rgb(var(--colors-aps4)));
  }
  :global(.hover\:border-ccs1:hover) {
    border-color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.hover\:border-ccs2:hover) {
    border-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.hover\:border-ccs3:hover) {
    border-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.hover\:border-ccs4:hover) {
    border-color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.hover\:text-ccs1:hover) {
    color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.hover\:text-ccs2:hover) {
    color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.hover\:text-ccs3:hover) {
    color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.hover\:text-ccs4:hover) {
    color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.hover\:fill-ccs1:hover) {
    fill: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.hover\:stroke-ccs1:hover) {
    stroke: var(--customcolor, rgb(var(--colors-aps1)));
  }

  :global(.group:hover .group-hover\:bg-ccs1) {
    background-color: var(--customcolor, rgb(var(--colors-aps1)));
    color: var(--fgwhencustombg, var(--fgwhenaccentbg));
  }
  :global(.group:hover .group-hover\:bg-ccs2) {
    background-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.group:hover .group-hover\:bg-ccs3) {
    background-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.group:hover .group-hover\:bg-ccs4) {
    background-color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }
  :global(.group:hover .group-hover\:bg-ccs5) {
    background-color: var(--customcolorshadefive, rgb(var(--colors-aps4)));
  }

  :global(.group:hover .group-hover\:border-ccs1) {
    border-color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.group:hover .group-hover\:border-ccs2) {
    border-color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.group:hover .group-hover\:border-ccs3) {
    border-color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.group:hover .group-hover\:border-ccs4) {
    border-color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }

  :global(.group:hover .group-hover\:text-ccs1) {
    color: var(--customcolor, rgb(var(--colors-aps1)));
  }
  :global(.group:hover .group-hover\:text-ccs2) {
    color: var(--customcolorshadetwo, rgb(var(--colors-aps2)));
  }
  :global(.group:hover .group-hover\:text-ccs3) {
    color: var(--customcolorshadethree, rgb(var(--colors-aps3)));
  }
  :global(.group:hover .group-hover\:text-ccs4) {
    color: var(--customcolorshadefour, rgb(var(--colors-aps4)));
  }

  :global(.to-ccs1) {
    --tw-gradient-to: var(--customcolor, rgb(var(--colors-aps1))) !important;
  }
  :global(.to-ccs2) {
    --tw-gradient-to: var(
      --customcolorshadetwo,
      rgb(var(--colors-aps2))
    ) !important;
  }
  :global(.to-ccs3) {
    --tw-gradient-to: var(
      --customcolorshadethree,
      rgb(var(--colors-aps3))
    ) !important;
  }
  :global(.to-ccs4) {
    --tw-gradient-to: var(
      --customcolorshadefour,
      rgb(var(--colors-aps4))
    ) !important;
  }
  :global(.to-ccs5) {
    --tw-gradient-to: var(
      --customcolorshadefive,
      rgb(var(--colors-aps4))
    ) !important;
  }

  :global(.via-ccs1) {
    --tw-gradient-via: var(--customcolor, rgb(var(--colors-aps1))) !important;
  }
  :global(.via-ccs2) {
    --tw-gradient-via: var(
      --customcolorshadetwo,
      rgb(var(--colors-aps2))
    ) !important;
  }
  :global(.via-ccs3) {
    --tw-gradient-via: var(
      --customcolorshadethree,
      rgb(var(--colors-aps3))
    ) !important;
  }
  :global(.via-ccs4) {
    --tw-gradient-via: var(
      --customcolorshadefour,
      rgb(var(--colors-aps4))
    ) !important;
  }
  :global(.via-ccs5) {
    --tw-gradient-via: var(
      --customcolorshadefive,
      rgb(var(--colors-aps4))
    ) !important;
  }

  :global(.\!bg-ccs1) {
    background-color: var(--customcolor, rgb(var(--colors-aps1))) !important;
    color: var(--fgwhencustombg, var(--fgwhenaccentbg)) !important;
  }
  :global(.\!border-ccs1) {
    border-color: var(--customcolor, rgb(var(--colors-aps1))) !important;
  }
</style>
