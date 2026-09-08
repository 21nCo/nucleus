<script lang="ts">
  import LinkSearchResultItem from "@nucleum/features/memory/common/linkbox/LinkSearchResultItem.svelte";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { onMount } from "svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import { queryLinkingSearchResults } from "@nucleum/features/memory/linking/link-search";

  let {
    subType,
    onSelect,
    onReset
  }: {
    subType: NodeType;
    onSelect: (event: CustomEvent) => void;
    onReset: () => void;
  } = $props();
  let searchQuery = $state("");
  let searchRef: TextSearchInput | undefined;

  function searchCallback(searchQuery: string) {
    return queryLinkingSearchResults(searchQuery, {
      resource:
        subType === NodeType.COLLECTION_AS_EMBED
          ? Resource.collection
          : subType === NodeType.TASK_AS_EMBED
            ? Resource.task
            : Resource.node,
      subType:
        subType !== NodeType.COLLECTION_AS_EMBED &&
        subType !== NodeType.TASK_AS_EMBED
          ? subType
          : undefined
    });
  }
  const label = $derived(subType ? enumToString(subType) + "s" : "");

  onMount(() => {
    setTimeout(() => {
      searchRef?.showDefaultResults();
    }, 100);
  });
</script>

<!-- TODO - improve search results - to show image preview, tweet preview, etc -->
<div class="mo:w-[20rem] bg-bgs1 rounded-md">
  <TextSearchInput
    bind:this={searchRef}
    bind:value={searchQuery}
    isInline={true}
    {searchCallback}
    placeholder={`Search ${label}`}
    emptyStateLabel="No results found"
    searchResultComponent={LinkSearchResultItem}
    searchResultComponentProps={{
      isHideResourceType: true
    }}
    {onSelect}
    {onReset}
  />
</div>
