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
      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm14.024-.983a1.125 1.125 0 010 1.966l-5.603 3.113A1.125 1.125 0 019 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      fill-rule="evenodd"
      d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.766.027l3.5 2.25a.75.75 0 010 1.262l-3.5 2.25A.75.75 0 018 12.25v-4.5a.75.75 0 01.39-.658z"
      clip-rule="evenodd"
    />
  {/if}
{:else if !isCircled}
  {#if variant === IconVariant.Outline}
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
    />
  {:else if variant === IconVariant.Solid}
    <path
      fill-rule="evenodd"
      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
      clip-rule="evenodd"
    />
  {:else if variant === IconVariant.Mini}
    <path
      d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"
    />
  {/if}
{/if}
