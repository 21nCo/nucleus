<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline
  }: {
    variant?: IconVariant;
  } = $props();

</script>

{#if variant === IconVariant.Outline}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
  />
{:else if variant === IconVariant.Solid}
  <path
    fill-rule="evenodd"
    d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
    clip-rule="evenodd"
  />
{:else if variant === IconVariant.Mini}
  <path
    d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"
  />
{/if}
