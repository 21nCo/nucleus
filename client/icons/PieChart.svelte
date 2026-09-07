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
    d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
  />
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
  />
{:else}
  <path
    fill-rule="evenodd"
    d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
    clip-rule="evenodd"
  />
  <path
    fill-rule="evenodd"
    d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
    clip-rule="evenodd"
  />
{/if}
