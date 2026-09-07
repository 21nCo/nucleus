<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import { renderMdAsHtml } from "@nucleum/components/markdown/markdown.utils";
  import RecordStarStatusFeedback from "@nucleum/components/record/RecordStarStatusFeedback.svelte";
  import type { ICollectionThumb } from "@nucleum/features/collections/collection.type";
  import CollectionThumbnailAvatar from "@nucleum/features/collections/thumbnail/CollectionThumbnailAvatar.svelte";
  let {
    item,
    isShowFallbackIcons = false,
    isShowAvatar = true,
    isShowStarStatus = false
  }: {
    item: ICollectionThumb;
    isShowFallbackIcons?: boolean;
    isShowAvatar?: boolean;
    isShowStarStatus?: boolean;
  } = $props();

  function resolveEmptyLabel() {
    //TODO - based on resource type
    return "Untitled";
  }

  function resolveLabelSearch() {
    return "labelSearch" in item && typeof item.labelSearch === "string"
      ? item.labelSearch
      : undefined;
  }
</script>

<span class="flex gap-2 items-center min-w-0 userdata">
  {#if isShowAvatar}
    <CollectionThumbnailAvatar {item} {isShowFallbackIcons} />
  {/if}
  <span
    class="text-left truncate userdata"
    use:tooltip={{
      text: item.label,
      isEnableOnlyOnTruncate: true
    }}
  >
    {#if resolveLabelSearch()}
      {@html renderMdAsHtml(resolveLabelSearch() ?? "")}
    {:else if item.label}
      {item.label}
    {:else}
      {resolveEmptyLabel()}
    {/if}
  </span>
  {#if isShowStarStatus}
    <RecordStarStatusFeedback isStarred={item.isStarred} />
  {/if}
</span>
