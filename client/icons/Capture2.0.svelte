<script lang="ts">
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline
  }: {
    variant?: IconVariant;
  } = $props();
</script>

<circle cx="26" cy="26" r="24.6" class="stroke-aps1" stroke-width="2.8" />
<circle
  cx="26"
  cy="26"
  r="23"
  class="fill-aps1 {variant === IconVariant.Mini ? '' : 'stroke-bgs1'}"
  stroke-width="1.5"
/>
