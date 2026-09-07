<script lang="ts">
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { CollectionType, type ICollectionThumb } from "@nucleum/features/collections/collection.type";
  let {
    item,
    isShowFallbackIcons = false,
    size = Size.sm
  }: {
    item: ICollectionThumb;
    isShowFallbackIcons?: boolean;
    size?: Size.sm | Size.md | Size.lg;
  } = $props();
  let avatar = $derived(item.avatar ?? item.typeToExtend?.avatar);
</script>

{#if item.type === CollectionType.TYPED && avatar}
  <AvatarRenderer {avatar} {size} />
{:else if item.type === CollectionType.QUERY}
  <Icon icon="at-symbol" {size} />
{:else if isShowFallbackIcons}
  <Icon icon="ph:circles-four" {size} />
{/if}
