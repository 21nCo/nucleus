<script lang="ts">
  import AvatarRenderer from "@21n/elements/avatarPicker/AvatarRenderer.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/types/size.enum";
  import { CollectionType } from "@nucleum/features/collections/collection.type";
  import type { CollectionData } from "@nucleum/extensions/clipper/sidePanel/collectionsOnClipper/types";

  let {
    collection,
    onclick = undefined
  }: {
    collection: CollectionData;
    onclick?: ((collection: CollectionData) => void) | undefined;
  } = $props();

  function handleClick() {
    onclick?.(collection);
  }
</script>

<div
  class="flex items-center gap-3 p-3 rounded-lg hover:bg-bgs2 cursor-pointer group transition-colors"
  onclick={handleClick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === "Enter" && handleClick()}
>
  <div class="flex-shrink-0">
    {#if collection.type === CollectionType.TYPED && collection.avatar}
      <AvatarRenderer avatar={collection.avatar} size={Size.md} />
    {:else}
      <Icon icon="collection" />
    {/if}
  </div>

  <div class="flex-1 min-w-0">
    <div
      class="font-medium text-fgs2 text-b2 group-hover:text-fgs1 transition-colors"
    >
      {collection.label}
    </div>
    <div class="text-fgs3 text-b3 mt-1">
      {collection.itemCount} web page{collection.itemCount !== 1 ? "s" : ""}
    </div>
  </div>

  <div
    class="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <Icon icon="ph:caret-right" size={Size.sm} />
  </div>
</div>
