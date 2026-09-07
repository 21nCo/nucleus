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
    d="m7.49 12-3.75 3.75m0 0 3.75 3.75m-3.75-3.75h16.5V4.499"
  />
{:else if variant === IconVariant.Solid}
  <path
    fill-rule="evenodd"
    d="M20.239 3.749a.75.75 0 0 0-.75.75V15H5.549l2.47-2.47a.75.75 0 0 0-1.06-1.06l-3.75 3.75a.75.75 0 0 0 0 1.06l3.75 3.75a.75.75 0 1 0 1.06-1.06L5.55 16.5h14.69a.75.75 0 0 0 .75-.75V4.5a.75.75 0 0 0-.75-.751Z"
    clip-rule="evenodd"
  />
{:else if variant === IconVariant.Mini}
  <path
    fill-rule="evenodd"
    d="M16.25 3a.75.75 0 0 0-.75.75v7.5H4.56l1.97-1.97a.75.75 0 0 0-1.06-1.06l-3.25 3.25a.75.75 0 0 0 0 1.06l3.25 3.25a.75.75 0 0 0 1.06-1.06l-1.97-1.97h11.69A.75.75 0 0 0 17 12V3.75a.75.75 0 0 0-.75-.75Z"
    clip-rule="evenodd"
  />
{/if}
