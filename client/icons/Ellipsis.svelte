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
      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm0 8.625a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM15.375 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zM7.5 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      fill-rule="evenodd"
      d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8 1a1 1 0 100-2 1 1 0 000 2zm-3-1a1 1 0 11-2 0 1 1 0 012 0zm7 1a1 1 0 100-2 1 1 0 000 2z"
      clip-rule="evenodd"
    />
  {/if}
{:else if !isCircled}
  {#if variant === IconVariant.Outline}
    {#if orientation === Orientation.Horizontal}
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
      />
    {:else if orientation === Orientation.Vertical}
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
      />
    {/if}
  {:else if variant === IconVariant.Solid}
    {#if orientation === Orientation.Horizontal}
      <path
        fill-rule="evenodd"
        d="M4.5 12a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm6 0a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
        clip-rule="evenodd"
      />
    {:else if orientation === Orientation.Vertical}
      <path
        fill-rule="evenodd"
        d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z"
        clip-rule="evenodd"
      />
    {/if}
  {:else if variant === IconVariant.Mini}
    {#if orientation === Orientation.Horizontal}
      <path
        d="M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
      />
    {:else if orientation === Orientation.Vertical}
      <path
        d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"
      />
    {/if}
  {/if}
{/if}
