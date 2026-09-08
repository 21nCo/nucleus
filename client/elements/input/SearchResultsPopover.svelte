<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { onMount } from "svelte";
  import SearchResultItem from "@21n/elements/input/SearchResultItem.svelte";
  import { debouncer } from "@21n/utils/utils";
  import { cn } from "@21n/utils/ui.utils";
  import type { IResource } from "@nucleum/datafn/resource.type";
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import Icon from "@21n/elements/Icon.svelte";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { appStore } from "@nucleum/stores/app.store";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { KeyboardKey, ModifierKey } from "@21n/elements/keyboard/keyboard.type";
  type SearchItem = Partial<IResource & Record<string, unknown>>;

  let {
    searchCallback = undefined,
    searchStoreId = undefined,
    searchResultComponent = undefined,
    searchResultComponentProps = {},
    shortcutTrigger = undefined,
    shortcutTriggers = [],
    emptyStateLabel = "No results found",
    isPreventDefaultResults = false,
    isInlineContext = false,
    isAlwaysShowSearchFeedback = false,
    bottomMessage = undefined,
    onSelect = undefined,
    onReset = undefined,
    onHide = undefined,
    onShow = undefined,
    onCount = undefined,
    onBlur = undefined,
    onEmptyEnter = undefined,
    isApplyPopoverStyling = false,
    id = generateSimpleRandomId(),
    isPreventAutoSelectZeroIndex = false
  }: {
    searchCallback?: Function | undefined;
    searchStoreId?: string | undefined;
    searchResultComponent?: any;
    searchResultComponentProps?: Record<string, unknown>;
    shortcutTrigger?: string | undefined;
    shortcutTriggers?: string[];
    emptyStateLabel?: string | { mainText?: string; subText?: string };
    isPreventDefaultResults?: boolean;
    isInlineContext?: boolean;
    isAlwaysShowSearchFeedback?: boolean;
    bottomMessage?: string | undefined;
    onSelect?: Function | undefined;
    onReset?: Function | undefined;
    onHide?: ((event: CustomEvent<void>) => void) | undefined;
    onShow?: ((event: CustomEvent<void>) => void) | undefined;
    onCount?: ((event: CustomEvent<{ count: number }>) => void) | undefined;
    onBlur?: ((event: CustomEvent<void>) => void) | undefined;
    onEmptyEnter?:
      | ((event: CustomEvent<{ event: KeyboardEvent; value: string }>) => void)
      | undefined;
    isApplyPopoverStyling?: boolean;
    id?: string;
    isPreventAutoSelectZeroIndex?: boolean;
  } = $props();

  let value = $state("");
  interface SearchResultWindowEventDetail {
    id: string;
    event: KeyboardEvent;
  }
  let results = $state<SearchItem[]>([]);
  let selectedIndex = $state(resolveDefaultIndexSelection());
  let currentValue = $state("");
  let isSearchInProgress = $state(false);
  let searchGeneration = 0;

  export function reset() {
    resetSearch();
    value = "";
    const resetEvent = new CustomEvent("reset");
    if (typeof onReset === "function") {
      onReset(resetEvent);
    }
  }

  export function resetSelectedIndex() {
    selectedIndex = resolveDefaultIndexSelection();
  }

  function resolveDefaultIndexSelection() {
    return isPreventAutoSelectZeroIndex ? -1 : 0;
  }

  function onSearchResultSelection(item: SearchItem, e?: MouseEvent) {
    logger.info({
      at: "SearchResultsPopover.onSearchResultSelection",
      selectedIndex,
      item,
      currentValue,
      resultsCount: results.length
    });
    const selectEvent = new CustomEvent("select", {
      detail: { item, event: e }
    });
    if (typeof onSelect === "function") {
      onSelect(selectEvent);
    }
    if (item?.id) {
      const type = determineResourceType(item.id);
      appStore.addToRecents({
        record: {
          ...item,
          bodySearch: undefined,
          labelSearch: undefined
        },
        type,
        timestamp: new Date()
      });
    }
    hide();
  }
  function resetSearch() {
    searchGeneration += 1;
    isSearchInProgress = false;
    results = [];
    selectedIndex = resolveDefaultIndexSelection();
    hide();
  }

  function resolveSearchItemLabel(item: SearchItem) {
    if (typeof item.label === "string") return item.label;
    if ("name" in item && typeof item.name === "string") return item.name;
    return "";
  }

  function resolveSearchValue(event: KeyboardEvent) {
    const target = event.target;
    if (target instanceof HTMLInputElement) return target.value;
    if (target instanceof HTMLElement) return target.innerText;
    return "";
  }

  function resolveKeyboardEvent(event: Event) {
    const detail = (event as CustomEvent<SearchResultWindowEventDetail>).detail;
    if (!detail?.event || detail.id !== id) return null;
    return detail.event;
  }

  function onWindowSearchResultKeyup(event: Event) {
    const keyboardEvent = resolveKeyboardEvent(event);
    if (!keyboardEvent) return;
    keyup(keyboardEvent);
  }

  function onWindowSearchResultKeydown(event: Event) {
    const keyboardEvent = resolveKeyboardEvent(event);
    if (!keyboardEvent) return;
    keydown(keyboardEvent);
  }

  onMount(() => {
    isSearchInProgress = !isPreventDefaultResults;
    window.addEventListener(
      "searchresultkeyup",
      onWindowSearchResultKeyup as EventListener
    );
    window.addEventListener(
      "searchresultkeydown",
      onWindowSearchResultKeydown as EventListener
    );
    return () => {
      window.removeEventListener(
        "searchresultkeyup",
        onWindowSearchResultKeyup as EventListener
      );
      window.removeEventListener(
        "searchresultkeydown",
        onWindowSearchResultKeydown as EventListener
      );
    };
  });

  export function keydown(event: KeyboardEvent) {
    logger.log({ at: "SearchResultsPopover - keydown", event });
    if (event.key === KeyboardKey.ARROW_DOWN) {
      selectedIndex = Math.min(selectedIndex + 1);
      if (selectedIndex === results?.length) {
        selectedIndex = 0;
      }
      event.preventDefault();
    } else if (event.key === KeyboardKey.ARROW_UP) {
      selectedIndex = Math.max(selectedIndex - 1, -1);
      if (selectedIndex === -1) {
        selectedIndex = results?.length;
      }
      event.preventDefault();
    }
  }

  const modifierKeys = [
    ModifierKey.META,
    ModifierKey.CTRL,
    ModifierKey.ALT,
    ModifierKey.SHIFT
  ];
  export function keyup(event: KeyboardEvent) {
    if (modifierKeys.includes(event.key as ModifierKey)) return;
    value = resolveSearchValue(event);
    if (shortcutTrigger && value?.includes(shortcutTrigger)) {
      value = value.split(shortcutTrigger)[1].split(" ")[0];
    }
    if (
      shortcutTriggers.length > 0 &&
      shortcutTriggers.some((trigger) => value.includes(trigger))
    ) {
      let trigger = shortcutTriggers.find((trigger) => value.includes(trigger));
      if (trigger) {
        value = value.split(trigger)[1].split("\u200b")[0];
      }
    }
    if (event.key === KeyboardKey.ESCAPE) {
      resetSearch();
      const blurEvent = new CustomEvent<void>("blur");
      if (typeof onBlur === "function") {
        onBlur(blurEvent);
      }
    } else if (event.key === KeyboardKey.BACKSPACE) {
      currentValue = value;
      queueSearch(value);
    } else if (event.key === KeyboardKey.ENTER) {
      if (results && results.length > 0) {
        onSearchResultSelection(results[selectedIndex]);
      } else {
        const emptyEnterEvent = new CustomEvent("empty-enter", {
          detail: { event, value }
        });
        if (typeof onEmptyEnter === "function") {
          onEmptyEnter(emptyEnterEvent);
        }
      }
    } else if (
      event.key !== KeyboardKey.ARROW_DOWN &&
      event.key !== KeyboardKey.ARROW_UP
    ) {
      currentValue = value;
      queueSearch(value);
    }
  }

  const debouncedSearch = debouncer((newValue: string, generation: number) => {
    if (generation !== searchGeneration) return;
    void search(newValue);
  }, 500);

  export function queueSearch(newValue?: string) {
    const generation = ++searchGeneration;
    currentValue = newValue ?? value;
    debouncedSearch(currentValue, generation);
  }

  export async function search(newValue?: string) {
    const val = newValue ?? value;
    const generation = ++searchGeneration;
    isSearchInProgress = true;
    selectedIndex = resolveDefaultIndexSelection();
    results = [];
    if (!val && isPreventDefaultResults) {
      results = [];
      hide();
      isSearchInProgress = false;
      return;
    }
    if (searchCallback) {
      try {
        const result = await searchCallback(val);
        if (generation !== searchGeneration) return;
        if (result) results = result;
        if (results.length > 0) {
          show();
        }
      } catch (error) {
        if (generation !== searchGeneration) return;
        logger.error({
          at: "SearchResultsPopover.search",
          value: val,
          searchStoreId,
          error
        });
        results = [];
      } finally {
        if (generation === searchGeneration) {
          isSearchInProgress = false;
          const countEvent = new CustomEvent("count", {
            detail: { count: results?.length }
          });
          if (typeof onCount === "function") {
            onCount(countEvent);
          }
        }
      }
      return;
    }

    isSearchInProgress = false;
    if (results?.length > 0) {
      show();
    }
    const countEvent = new CustomEvent("count", {
      detail: { count: results?.length }
    });
    if (typeof onCount === "function") {
      onCount(countEvent);
    }
  }

  function show() {
    const showEvent = new CustomEvent<void>("show");
    if (typeof onShow === "function") {
      onShow(showEvent);
    }
  }

  function hide() {
    const hideEvent = new CustomEvent<void>("hide");
    if (typeof onHide === "function") {
      onHide(hideEvent);
    }
  }
</script>

<div
  {id}
  class={cn("flex flex-col justify-between w-full", {
    "max-h-72 h-72": !isInlineContext,
    "h-full": isInlineContext,
    "bg-bgs1 rounded-md border border-brs2": isApplyPopoverStyling
  })}
>
  <div class="flex flex-col overflow-y-auto-scrollbar items-center w-full">
    {#if isAlwaysShowSearchFeedback && isSearchInProgress}
      <span class="flex items-center gap-2 p-2">
        <Icon icon="svg-spinners:3-dots-fade" />
        <span class="text-b3 text-fgs3">Searching...</span>
      </span>
    {:else if results && results.length > 0}
      {#each results as item, index ((item.id ?? "") + item.value)}
        <SearchResultItem
          label={resolveSearchItemLabel(item)}
          isActive={selectedIndex === index}
          onclick={(e) => {
            onSearchResultSelection(item, e);
          }}
        >
          {#if searchResultComponent}
            {@const SearchResultComponent = searchResultComponent}
            <SearchResultComponent
              {item}
              {...searchResultComponentProps}
              isActive={selectedIndex === index}
            />
          {:else}
            <span class="truncate">
              {item.label}
            </span>
          {/if}
        </SearchResultItem>
      {/each}
    {:else}
      <div class="flex w-full justify-center p-2 text-b3 text-fgs3">
        {#if isSearchInProgress}
          <span class="flex items-center gap-2 p-2">
            <Icon icon="svg-spinners:3-dots-fade" />
            <span class="text-b3 text-fgs3">Searching...</span>
          </span>
        {:else if results?.length === 0}
          {#if typeof emptyStateLabel === "string"}
            <span>
              {@html renderMdAsHtml(emptyStateLabel)}
            </span>
          {:else if emptyStateLabel.mainText && emptyStateLabel.subText}
            <div class="flex flex-col gap-2 text-center">
              <span class="text-b2 font-medium">
                {@html renderMdAsHtml(emptyStateLabel.mainText)}
              </span>
              <span>
                {@html renderMdAsHtml(emptyStateLabel.subText)}
              </span>
            </div>
          {/if}
        {/if}
      </div>
    {/if}
  </div>
  {#if !isInlineContext}
    <div
      class={cn("w-full flex items-center gap-6 cw:px-2 px-4 cw:py-2 py-1", {
        "justify-between bg-bgs2": bottomMessage,
        "justify-center": !bottomMessage
      })}
    >
      {#if bottomMessage}
        <span class="text-b3 text-fgs3 text-left">
          {@html renderMdAsHtml(bottomMessage)}
        </span>
      {/if}
      <button
        class="flex items-center gap-1 active:bg-bgs2 notouch:hover:bg-bgs2 px-1 rounded-md"
        onclick={reset}
      >
        <Icon icon="cross" size={Size.sm} class="text-fgs3" />
        <span class="text-fgs3 text-b2">Close</span>
      </button>
    </div>
  {/if}
</div>
