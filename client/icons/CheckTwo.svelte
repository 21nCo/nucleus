<script lang="ts">
  import { Orientation } from "@21n/elements/direction.enum";
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    orientation = Orientation.Horizontal,
    variant = IconVariant.Outline,
    isCircled = false
  }: {
    orientation?: Orientation;
    variant?: IconVariant;
    isCircled?: boolean;
  } = $props();

</script>

{#if isCircled && orientation === Orientation.Horizontal}
  {#if variant === IconVariant.Outline}
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      fill-rule="evenodd"
      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
      clip-rule="evenodd"
    />
  {/if}
{:else if !isCircled}
  {#if variant === IconVariant.Outline}
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="m4.5 12.75 6 6 9-13.5"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      fill-rule="evenodd"
      d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
      clip-rule="evenodd"
    />
  {/if}
{/if}
