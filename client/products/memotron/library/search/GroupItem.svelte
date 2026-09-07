<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import { Size } from "@21n/types/size.enum";
  import LinkSearchResultItem from "@nucleum/features/memory/common/linkbox/LinkSearchResultItem.svelte";
  import SearchResultsPopover from "@21n/elements/input/SearchResultsPopover.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import Badge from "@21n/elements/text/Badge.svelte";
  import { isValidNumber } from "@21n/shared-utils/text.utils";
  import { Display } from "@21n/types/view.type";
  import view from "@nucleum/stores/view.store";
  let {
    group,
    index,
    isActive = false,
    isDefaultState = false,
    searchCallback,
    onExpand = undefined,
    onSelect = undefined
  }: {
    group: any;
    index: number;
    isActive?: boolean;
    isDefaultState?: boolean;
    searchCallback: (query: string) => void;
    onExpand?: ((event: CustomEvent<{ group: any }>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let searchResultsPopover: SearchResultsPopover;
  let count = $state<number | undefined>(undefined);
  export function keydown(event: KeyboardEvent) {
    searchResultsPopover?.keydown(event);
  }

  export function keyup(event: KeyboardEvent) {
    searchResultsPopover?.keyup(event);
  }

  export function search(query?: string) {
    searchResultsPopover?.search(query);
  }

  export function resetSelectedIndex() {
    searchResultsPopover?.resetSelectedIndex();
  }
</script>

<div
  class={cn(
    "flex flex-col border-b border-brs1 bg-bgs1 min-h-96 grow overflow-y-auto",
    {
      "border-r":
        $view.display === Display.TK
          ? !((index + 1) % 3 === 0)
          : index % 2 === 0,
      hidden: count === 0
    }
  )}
>
  <div
    class={cn(
      "flex items-center justify-between px-3 py-2 border-b min-h-11 h-11",
      {
        "border-brs2 bg-bgs2": isActive,
        "border-brs1": !isActive
      }
    )}
  >
    <div
      class={cn("flex items-center gap-2", {
        "text-fgs3": !isActive,
        "text-fgs1": isActive
      })}
    >
      <Icon
        icon={group.icon}
        size={Size.sm}
        class={cn({
          "text-fgs2": !isActive,
          "text-fgs1": isActive
        })}
        isFilled={isActive}
      />
      <div>
        {group.label}
      </div>
      {#if !isDefaultState && count !== undefined}
        <Badge text={count} />
      {/if}
    </div>
    {#if count && count >= 5}
      <Button
        icon="expand"
        tooltip="Expand results"
        style={isActive ? ButtonStyle.OUTLINED : ButtonStyle.DEFAULT}
        size={isActive ? Size.sm : Size.md}
        onclick={() => {
          onExpand?.(new CustomEvent("expand", { detail: { group } }));
        }}
      />
    {/if}
  </div>
  <div class="flex-grow w-full pb-2">
    <SearchResultsPopover
      bind:this={searchResultsPopover}
      isPreventAutoSelectZeroIndex={!isActive}
      {searchCallback}
      emptyStateLabel="No results found"
      searchResultComponent={LinkSearchResultItem}
      isInlineContext={true}
      isAlwaysShowSearchFeedback={true}
      onCount={(e) => {
        if (isValidNumber(e?.detail?.count)) {
          count = +e?.detail?.count;
        }
      }}
      onSelect={(e: CustomEvent<any>) => {
        onSelect?.(new CustomEvent("select", { detail: { ...e.detail, group } }));
      }}
    />
  </div>
</div>
