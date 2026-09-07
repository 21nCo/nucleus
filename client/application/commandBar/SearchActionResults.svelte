<script lang="ts">
  import { tick } from "svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import type { IAction } from "@nucleum/application/commandBar/action.type";
  import type { Component } from "svelte";
  import { Size } from "@21n/elements/size.enum";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import ResultItem from "@nucleum/application/commandBar/ResultItem.svelte";
  import type { IResource } from "@nucleum/datafn/resource.type";
  import TextWithHoverTooltip from "@21n/elements/text/TextWithHoverTooltip.svelte";
  import { debouncer } from "@21n/utils/utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import BreadcrumbMini from "@21n/elements/breadcrumb/BreadcrumbMini.svelte";
  let {
    action,
    componentParams = undefined,
    search = "",
    onClose = void 0
  }: {
    action: IAction;
    componentParams?: any;
    search?: string;
    onClose?: () => void;
  } = $props();
  type SearchActionResult = IResource &
    Partial<{
      label: string;
      parent: {
        hierarchy: Array<{ label: string }>;
      };
    }> &
    Record<string, unknown>;
  let selectedIndex = $state(0);
  let isSearchInProgress = $state(false);
  let results = $state<SearchActionResult[]>([]);

  function resolveHierarchy(result: SearchActionResult) {
    const parent = result.parent;
    if (!parent?.hierarchy) return [];
    return parent.hierarchy
      .filter(
        (item): item is { label: string } =>
          Boolean(item) && typeof item.label === "string"
      )
      .map((item) => item.label);
  }

  function resolveLabel(result: SearchActionResult) {
    return typeof result.label === "string" ? result.label : "";
  }

  function resetSearch() {
    results = [];
    selectedIndex = 0;
  }
  const debouncedSearch = debouncer(searchResources, 500);
  $effect(() => {
    search;
    action;
    componentParams;
    debouncedSearch();
  });
  async function searchResources() {
    try {
      resetSearch();
      if (!action.searchActionParams?.searchCallback) return;
      isSearchInProgress = true;
      selectedIndex = 0;
      if (action.searchActionParams?.searchCallback) {
        const searchResults = await action.searchActionParams.searchCallback(
          search,
          componentParams
        );
        results = Array.isArray(searchResults) ? searchResults : [];
      }
      isSearchInProgress = false;
    } catch (e) {
      logger.error({ at: "Cmd bar - SearchActionResults", error: e });
    }
  }
  export async function select() {
    const selectedItem = results[selectedIndex] ?? results[0];
    if (!selectedItem.id) return;
    onClose?.();
    await tick();
    action.searchActionParams?.callback(selectedItem, componentParams);
  }
  export function moveSelection(direction: "up" | "down") {
    let nextIndex = selectedIndex;
    if (direction === "down") {
      nextIndex = selectedIndex + 1 >= results.length ? 0 : selectedIndex + 1;
    } else if (direction === "up") {
      nextIndex =
        selectedIndex - 1 < 0 ? results.length - 1 : selectedIndex - 1;
    }
    selectedIndex = nextIndex;
  }

  function resolveSearchResultComponent() {
    return action.searchActionParams?.searchResultComponent as
      | Component<{ item: SearchActionResult }>
      | undefined;
  }
</script>

{#if isValidArrayWithData(results)}
  {#each results as result, index (result.id)}
    <ResultItem
      isActive={selectedIndex === index}
      onclick={() => {
        selectedIndex = index;
        select();
      }}
      isSearchAction={true}
    >
      {@const SearchResultComponent = resolveSearchResultComponent()}
      {#if SearchResultComponent}
        <SearchResultComponent item={result} />
      {:else}
        {@const hierarchy = resolveHierarchy(result)}
        <div class="flex flex-col w-full items-start">
          {#if hierarchy.length > 0}
            <BreadcrumbMini {hierarchy} />
          {/if}
          <TextWithHoverTooltip
            text={resolveLabel(result)}
            class="text-left truncate w-full max-w-full"
          />
        </div>

        <!-- <span class="flex min-w-0 flex-1">
      <TextWithHoverTooltip text={result.label} class="truncate" />
    </span> -->
        {#if action.searchActionParams?.searchResourceType}
          <div class="bg-bgs2 rounded-md text-b3 text-fgs2 px-2 py-1">
            {action.searchActionParams?.searchResourceType}
          </div>
        {/if}
      {/if}
    </ResultItem>
  {/each}
{:else}
  <EmptyStatusView
    isLoadingState={isSearchInProgress}
    size={Size.sm}
    loadingText="searching..."
    subText="No matches found!"
  />
{/if}
