<script lang="ts">
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { properCase } from "@21n/shared-utils/text.utils";
  import BlockItem from "@nucleum/features/memory/markdown/blockBrowser/BlockItem.svelte";
  import { getContext } from "svelte";
  import { cn } from "@21n/utils/ui.utils";
  import Badge from "@21n/elements/text/Badge.svelte";
  import context from "@nucleum/stores/context.store";
  import type { IBlockBrowserSection } from "@nucleum/features/memory/markdown/blockBrowser/blockBrowser.type";
  import { resolveBlockBrowserConfig } from "@nucleum/features/memory/markdown/blockBrowser/blockBrowser.utils";
  import { Context } from "@nucleum/stores/appStore.type";
  const nodeContext = getContext<any>(Context.NODE);

  let {
    variant = "v2",
    isSingleColumnMode = false,
    onSelect = () => {},
    searchQueryString = $bindable("")
  }: {
    variant?: "v1" | "v2";
    isSingleColumnMode?: boolean;
    onSelect?: (e: any) => void;
    searchQueryString?: string;
  } = $props();

  let selectedSection = $state("");
  let focusedItem = $state<any>();

  const config: IBlockBrowserSection[] = resolveBlockBrowserConfig({
    contentType: nodeContext?.contentType,
    context: $context
  });

  let filteredResults = $state<any[]>(
    config
      .map((section) => {
        return {
          section: section.section,
          children: section.children
            .filter((c) => !c.isDisabled)
            .map((c) => {
              return {
                ...c,
                section: section.section
              };
            })
        };
      })
      .filter((section) => section.children.length > 0)
  );
  selectedSection = filteredResults[0].section;
  focusedItem = filteredResults[0].children[0];

  function mapSectionNameToBlock(c: any, sectionName: string) {
    return {
      ...c,
      section: sectionName
    };
  }

  function allFilteredBlocks() {
    if (searchQueryString) {
      return filteredResults
        .map((section) =>
          section.children.map((c: any) =>
            mapSectionNameToBlock(c, section.section)
          )
        )
        .flat();
    } else {
      return config
        .map((section) =>
          section.children.map((c: any) =>
            mapSectionNameToBlock(c, section.section)
          )
        )
        .flat();
    }
  }

  export function key(key: "ArrowUp" | "ArrowDown" | "Enter") {
    let blocks = allFilteredBlocks();
    let index = blocks.indexOf(
      blocks.find((k: any) => compareBlock(k, focusedItem))
    );
    if (key === "ArrowUp") {
      if (index > 0) {
        focusedItem = blocks[index - 1];
      }
    } else if (key === "ArrowDown") {
      if (index < blocks.length - 1) {
        focusedItem = blocks[index + 1];
      }
    } else if (key === "Enter") {
      onSelection();
    }
    if (selectedSection != focusedItem.section) {
      selectedSection = focusedItem.section;
    }
  }

  export function filter(query: string) {
    const rawQueryString = query.split("/").pop() ?? "";
    const newQueryString = resolveSearchQuery(rawQueryString);
    if (searchQueryString === newQueryString) {
      return;
    }
    searchQueryString = newQueryString;
    filteredResults = config
      .filter((section) => !section.isDisabled)
      .map((section) => {
        return {
          section: section.section,
          children: section.children
            .map((c) => mapSectionNameToBlock(c, section.section))
            .filter((block) => !block.isDisabled)
            .filter((block) => {
              return block.label
                .toLowerCase()
                .includes(searchQueryString.toLowerCase());
            })
        };
      });
    filteredResults = filteredResults.filter((section) => {
      return section.children.length > 0;
    });
    if (filteredResults.length > 0) {
      focusedItem = filteredResults[0].children[0];
    } else {
    }
  }

  function resolveSearchQuery(query: string) {
    return query.trim().toLowerCase();
  }

  function onSelection(e?: CustomEvent) {
    const item = e?.detail || focusedItem;
    if (item.isDisabled) return;
    const event = new CustomEvent("select", { detail: item });
    onSelect(event);
  }

  function compareBlock(a: any, b: any) {
    return a.type + a.sub === b.type + b.sub;
  }
</script>

<div
  class={cn(
    "blockbrowser bg-bgs1 border border-brs2 backdrop-blur h-[30rem] rounded-md flex flex-col gap-6 overflow-auto styledscroll",
    {
      "w-72": searchQueryString || isSingleColumnMode,
      "w-[30rem]": !searchQueryString && !isSingleColumnMode,
      "p-2 pb-10": variant === "v1" || searchQueryString || isSingleColumnMode
    }
  )}
>
  {#if variant === "v1" || searchQueryString || isSingleColumnMode}
    {#if isValidArrayWithData(filteredResults)}
      {#each filteredResults as section}
        <div class="flex flex-col items-start gap-2">
          <div class="flex px-2">
            <Text content={section.section} style={TextStyle.SECTION_HEADING} />
          </div>
          <div class="flex flex-wrap w-full">
            {#each section.children as block}
              <BlockItem
                {block}
                onSelect={onSelection}
                isFocused={compareBlock(focusedItem, block)}
                width={searchQueryString || isSingleColumnMode
                  ? "w-full min-w-full"
                  : "w-52"}
              />
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      <EmptyStatusView
        size={Size.sm}
        subText="No blocks found. Please try another search query"
      />
    {/if}
  {:else}
    <div class="flex h-full w-full">
      <aside
        class="flex flex-col items-start gap-2 bg-bgs2 h-full px-2 py-4 grow"
      >
        <Text content="Block type" style={TextStyle.SECTION_HEADING_SMALL} />
        <div class="flex flex-col gap-1 w-full overflow-auto">
          {#each config as section}
            <button
              class={cn(
                "flex items-center gap-3 hover:bg-bgs3 py-2 px-2 rounded-md text-h5",
                {
                  "bg-bgs3 font-medium": selectedSection === section.section,
                  "font-light": selectedSection !== section.section,
                  "opacity-70": section.isDisabled
                }
              )}
              onclick={(event) => {
                event.stopPropagation();
                selectedSection = section.section;
              }}
            >
              <div class="text-left">{properCase(section.section)}</div>
              {#if section.badge}
                <Badge text={section.badge} />
              {/if}
            </button>
          {/each}
        </div>
      </aside>
      <div
        class="flex flex-col py-4 px-2 w-72 overflow-auto styledscroll pb-20"
      >
        {#each config as section}
          {#if section.section === selectedSection}
            {#each section.children as block}
              <BlockItem
                {block}
                onSelect={onSelection}
                isFocused={compareBlock(focusedItem, block)}
              />
            {/each}
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .blockbrowser {
    box-shadow: 0px 0px 6px 0px rgba(var(--colors-bgs3), 1);
  }
</style>
