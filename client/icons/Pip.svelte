<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline
  }: {
    variant?: IconVariant;
  } = $props();
</script>

{#if variant === IconVariant.Outline}
  <rect x="2.25" y="3.875" width="18.5" height="15.25" rx="2.5" />
  <rect x="12" y="12" width="10.75" height="9.125" rx="1.5" />
{:else if variant === IconVariant.Solid}
  <path
    fill-rule="evenodd"
    clip-rule="evenodd"
    d="M2 6.9375C2 5.28065 3.34315 3.9375 5 3.9375H19C20.6569 3.9375 22 5.28065 22 6.9375V11H21V6.9375C21 5.83293 20.1046 4.9375 19 4.9375H5C3.89543 4.9375 3 5.83293 3 6.9375V16.9375C3 18.0421 3.89543 18.9375 5 18.9375H11V19.9375H5C3.34315 19.9375 2 18.5944 2 16.9375V6.9375Z"
  />
  <rect x="12" y="11.9375" width="9.75" height="8.125" rx="1" />
{:else if variant === IconVariant.Mini}
  <path
    fill-rule="evenodd"
    d="M10 2c-1.716 0-3.408.106-5.07.31C3.806 2.45 3 3.414 3 4.517V17.25a.75.75 0 001.075.676L10 15.082l5.925 2.844A.75.75 0 0017 17.25V4.517c0-1.103-.806-2.068-1.93-2.207A41.403 41.403 0 0010 2z"
    clip-rule="evenodd"
  />
{/if}
