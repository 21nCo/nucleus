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
    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
  />
{:else if variant === IconVariant.Solid}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
  />
{:else if variant === IconVariant.Mini}
  <path
    fill-rule="evenodd"
    d="M6.28 5.22a.75.75 0 010 1.06L2.56 10l3.72 3.72a.75.75 0 01-1.06 1.06L.97 10.53a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0zm7.44 0a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 010-1.06zM11.377 2.011a.75.75 0 01.612.867l-2.5 14.5a.75.75 0 01-1.478-.255l2.5-14.5a.75.75 0 01.866-.612z"
    clip-rule="evenodd"
  />
{/if}
