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
        d="M162.83 98.83L133.66 128l29.17 29.17a4 4 0 0 1-5.66 5.66L128 133.66l-29.17 29.17a4 4 0 0 1-5.66-5.66L122.34 128L93.17 98.83a4 4 0 0 1 5.66-5.66L128 122.34l29.17-29.17a4 4 0 1 1 5.66 5.66M228 128A100 100 0 1 1 128 28a100.11 100.11 0 0 1 100 100m-8 0a92 92 0 1 0-92 92a92.1 92.1 0 0 0 92-92"
      />
    </svg>
  {:else if _variant === "light"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <path
        class="fill-fgs1"
        d="M164.24 100.24L136.48 128l27.76 27.76a6 6 0 1 1-8.48 8.48L128 136.48l-27.76 27.76a6 6 0 0 1-8.48-8.48L119.52 128l-27.76-27.76a6 6 0 0 1 8.48-8.48L128 119.52l27.76-27.76a6 6 0 0 1 8.48 8.48M230 128A102 102 0 1 1 128 26a102.12 102.12 0 0 1 102 102m-12 0a90 90 0 1 0-90 90a90.1 90.1 0 0 0 90-90"
      />
    </svg>
  {:else if _variant === "duotone"}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
      <g class="fill-fgs1">
        <path d="M224 128a96 96 0 1 1-96-96a96 96 0 0 1 96 96" opacity="0.2" />
        <path
          d="M165.66 101.66L139.31 128l26.35 26.34a8 8 0 0 1-11.32 11.32L128 139.31l-26.34 26.35a8 8 0 0 1-11.32-11.32L116.69 128l-26.35-26.34a8 8 0 0 1 11.32-11.32L128 116.69l26.34-26.35a8 8 0 0 1 11.32 11.32M232 128A104 104 0 1 1 128 24a104.11 104.11 0 0 1 104 104m-16 0a88 88 0 1 0-88 88a88.1 88.1 0 0 0 88-88"
        />
      </g>
    </svg>
  {/if}
{:else if variant === IconVariant.Solid}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
    <path
      class="fill-aps1"
      d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m37.66 130.34a8 8 0 0 1-11.32 11.32L128 139.31l-26.34 26.35a8 8 0 0 1-11.32-11.32L116.69 128l-26.35-26.34a8 8 0 0 1 11.32-11.32L128 116.69l26.34-26.35a8 8 0 0 1 11.32 11.32L139.31 128Z"
    />
  </svg>
{/if}
