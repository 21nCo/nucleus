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
    d="M18.75 19.5H5.25C4.14543 19.5 3.25 18.6046 3.25 17.5V10.7139C3.25 10.2522 3.40973 9.80478 3.70209 9.44745L6.21623 6.3746C7.01179 5.40226 8.49631 5.39557 9.30059 6.36071L11.4281 8.91374C12.1513 9.7815 13.449 9.87864 14.2933 9.12819L15.7435 7.83915C16.5736 7.10126 17.846 7.18109 18.5773 8.01696L20.2552 9.93446C20.5742 10.299 20.75 10.767 20.75 11.2515V17.5C20.75 18.6046 19.8546 19.5 18.75 19.5Z"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
{:else if variant === IconVariant.Solid}
  <!--  -->
{:else if variant === IconVariant.Mini}
  <!--  -->
{/if}
