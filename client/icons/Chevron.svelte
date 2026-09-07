<script lang="ts">
  import { Placement } from "@21n/elements/direction.enum";

  let {
    direction = Placement.Left
  }: {
    direction?: Placement;
  } = $props();
</script>

{#if direction === Placement.Left}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M15.75 19.5L8.25 12l7.5-7.5"
  />
{:else if direction === Placement.Right}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M8.25 4.5l7.5 7.5-7.5 7.5"
  />
{:else if direction === Placement.Top}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M4.5 15.75l7.5-7.5 7.5 7.5"
  />
{:else if direction === Placement.Bottom}
  <path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
  />
{/if}
