<script lang="ts">
  import { Placement } from "@21n/elements/direction.enum";
  import { IconVariant } from "@21n/elements/icon.type";

  let {
    variant = IconVariant.Outline,
    direction = Placement.Left
  }: {
    variant?: IconVariant;
    direction?: Placement;
  } = $props();
</script>

{#if direction === Placement.Bottom}
  <path
    d="M6.40002 15.6L10.4 19.6M10.4 19.6L14.4 15.6M10.4 19.6L10.4 6.8C10.4 5.47451 11.4745 4.4 12.8 4.4H17.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
{:else if direction === Placement.Left}
  <path
    d="M8.40002 6.4L4.40002 10.4M4.40002 10.4L8.40002 14.4M4.40002 10.4H17.2C18.5255 10.4 19.6 11.4745 19.6 12.8V17.6"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
{/if}
