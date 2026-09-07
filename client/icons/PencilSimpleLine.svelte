<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline,
    ...svgProps
  }: {
    variant?: IconVariant;
  } & SVGAttributes<SVGSVGElement> = $props();
</script>

{#if variant === IconVariant.Outline}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
    <path
      class="fill-fgs1"
      d="M224.49 76.2L179.8 31.51a12 12 0 0 0-17 0L39.51 154.83a12 12 0 0 0-3.51 8.48V208a12 12 0 0 0 12 12h168a4 4 0 0 0 0-8H105.66L224.49 93.17a12 12 0 0 0 0-16.97M94.34 212H48a4 4 0 0 1-4-4v-44.69a4 4 0 0 1 1.17-2.82L136 69.66L186.35 120ZM218.83 87.51L192 114.34L141.66 64l26.83-26.83a4 4 0 0 1 5.66 0l44.68 44.69a4 4 0 0 1 0 5.65"
    />
  </svg>
{:else if variant === IconVariant.Solid}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...svgProps}>
    <path
      class="fill-aps1"
      d="m227.32 73.37l-44.69-44.68a16 16 0 0 0-22.63 0L36.69 152A15.86 15.86 0 0 0 32 163.31V208a16 16 0 0 0 16 16h168a8 8 0 0 0 0-16H115.32l112-112a16 16 0 0 0 0-22.63M192 108.69L147.32 64l24-24L216 84.69Z"
    />
  </svg>
{/if}
