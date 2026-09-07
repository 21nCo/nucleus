<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  let {
    isStarred = false,
    size = Size.sm
  }: {
    isStarred?: boolean;
    size?: Size.xxs | Size.xs | Size.sm | Size.md | Size.lg | Size.xl | Size.xxl;
  } = $props();
</script>

{#if isStarred}
  <Icon icon="star" class="text-yellow-400" {size} isFilled={true} />
{/if}
