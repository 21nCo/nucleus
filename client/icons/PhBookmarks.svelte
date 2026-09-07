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
        d="M160 60H64a12 12 0 0 0-12 12v152a4 4 0 0 0 6.33 3.25L112 188.92l53.69 38.33a3.94 3.94 0 0 0 2.31.75a4.1 4.1 0 0 0 1.83-.44A4 4 0 0 0 172 224V72a12 12 0 0 0-12-12m4 156.23l-49.68-35.49a4 4 0 0 0-4.65 0L60 216.23V72a4 4 0 0 1 4-4h96a4 4 0 0 1 4 4ZM204 40v152a4 4 0 0 1-8 0V40a4 4 0 0 0-4-4H88a4 4 0 0 1 0-8h104a12 12 0 0 1 12 12"
      />
    </svg>
  {:else if _variant === "light"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <path
        class="fill-fgs1"
        d="M160 58H64a14 14 0 0 0-14 14v152a6 6 0 0 0 9.49 4.88L112 191.37l52.52 37.51A6 6 0 0 0 174 224V72a14 14 0 0 0-14-14m2 154.34l-46.52-33.22a6 6 0 0 0-7 0L62 212.34V72a2 2 0 0 1 2-2h96a2 2 0 0 1 2 2ZM206 40v152a6 6 0 0 1-12 0V40a2 2 0 0 0-2-2H88a6 6 0 0 1 0-12h104a14 14 0 0 1 14 14"
      />
    </svg>
  {:else if _variant === "duotone"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <g class="fill-fgs1">
        <path
          d="M168 72v152l-56-40l-56 40V72a8 8 0 0 1 8-8h96a8 8 0 0 1 8 8"
          opacity="0.2"
        />
        <path
          d="M160 56H64a16 16 0 0 0-16 16v152a8 8 0 0 0 12.65 6.51L112 193.83l51.36 36.68A8 8 0 0 0 176 224V72a16 16 0 0 0-16-16m0 152.46l-43.36-31a8 8 0 0 0-9.3 0L64 208.45V72h96ZM208 40v152a8 8 0 0 1-16 0V40H88a8 8 0 0 1 0-16h104a16 16 0 0 1 16 16"
        />
      </g>
    </svg>
  {/if}
{:else if variant === IconVariant.Solid}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
    <g class="fill-aps1">
      <path
        d="M160 56H64a16 16 0 0 0-16 16v152a8 8 0 0 0 12.65 6.51L112 193.83l51.36 36.68A8 8 0 0 0 176 224V72a16 16 0 0 0-16-16"
      />
      <path
        d="M192 24H88a8 8 0 0 0 0 16h104v152a8 8 0 0 0 16 0V40a16 16 0 0 0-16-16"
      />
    </g>
  </svg>
{/if}
