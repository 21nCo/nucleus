<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline,
    isCircled = false
  }: {
    variant?: IconVariant;
    isCircled?: boolean;
  } = $props();
</script>

{#if isCircled}
  {#if variant === IconVariant.Outline}
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm3 10.5a.75.75 0 000-1.5H9a.75.75 0 000 1.5h6z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      fill-rule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z"
      clip-rule="evenodd"
    />
  {/if}
{:else if variant === IconVariant.Outline}
  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12h-15" />
{:else if variant === IconVariant.Solid}
  <path
    fill-rule="evenodd"
    d="M3.75 12a.75.75 0 01.75-.75h15a.75.75 0 010 1.5h-15a.75.75 0 01-.75-.75z"
    clip-rule="evenodd"
  />
{:else if variant === IconVariant.Mini}
  <path
    fill-rule="evenodd"
    d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z"
    clip-rule="evenodd"
  />
{/if}
