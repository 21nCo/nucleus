<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline,
    _variant = "light",
    ...svgProps
  }: {
    variant?: IconVariant;
    _variant?: "duotone" | "light" | "thin";
  } & SVGAttributes<SVGSVGElement> = $props();
</script>

{#if variant === IconVariant.Outline}
  {#if _variant === "thin"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <path
        class="fill-fgs1"
        d="M236 192a4 4 0 0 1-4 4h-36v36a4 4 0 0 1-8 0v-36H64a4 4 0 0 1-4-4V68H24a4 4 0 0 1 0-8h36V24a4 4 0 0 1 8 0v164h164a4 4 0 0 1 4 4M96 68h92v92a4 4 0 0 0 8 0V64a4 4 0 0 0-4-4H96a4 4 0 0 0 0 8"
      />
    </svg>
  {:else if _variant === "light"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <path
        class="fill-fgs1"
        d="M238 192a6 6 0 0 1-6 6h-34v34a6 6 0 0 1-12 0v-34H64a6 6 0 0 1-6-6V70H24a6 6 0 0 1 0-12h34V24a6 6 0 0 1 12 0v162h162a6 6 0 0 1 6 6M96 70h90v90a6 6 0 0 0 12 0V64a6 6 0 0 0-6-6H96a6 6 0 0 0 0 12"
      />
    </svg>
  {:else if _variant === "duotone"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <g class="fill-fgs1">
        <path d="M192 64v128H64V64Z" opacity="0.2" />
        <path
          d="M240 192a8 8 0 0 1-8 8h-32v32a8 8 0 0 1-16 0v-32H64a8 8 0 0 1-8-8V72H24a8 8 0 0 1 0-16h32V24a8 8 0 0 1 16 0v160h160a8 8 0 0 1 8 8M96 72h88v88a8 8 0 0 0 16 0V64a8 8 0 0 0-8-8H96a8 8 0 0 0 0 16"
        />
      </g>
    </svg>
  {/if}
{:else if variant === IconVariant.Solid}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
    <path
      class="fill-aps1"
      d="M208 32H48a16 16 0 0 0-16 16v160a16 16 0 0 0 16 16h160a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16m-88 48h48a8 8 0 0 1 8 8v48a8 8 0 0 1-16 0V96h-40a8 8 0 0 1 0-16m72 96h-16v16a8 8 0 0 1-16 0v-16H88a8 8 0 0 1-8-8V96H64a8 8 0 0 1 0-16h16V64a8 8 0 0 1 16 0v96h96a8 8 0 0 1 0 16"
    />
  </svg>
{/if}
