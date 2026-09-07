<script lang="ts">
  import InlineSearchBar from "@21n/elements/InlineSearchBar.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { cn } from "@21n/utils/ui.utils";
  import { fly } from "svelte/transition";
  import { recentsStore } from "@nucleum/application/record/recent.store";
  import Records from "@nucleum/application/record/Records.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { Size } from "@21n/elements/size.enum";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { onMount, onDestroy } from "svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { appStore } from "@nucleum/stores/app.store";
  import { resolveProductResources } from "@nucleum/datafn/resource.utils";

  let {
    isActive = false,
    isSearchFocused = $bindable(false)
  }: {
    isActive?: boolean;
    isSearchFocused?: boolean;
  } = $props();
  let librarySearchQuery = $state("");
  let searchData = $state<any[]>([]);
  let searchRef: InlineSearchBar;
  let height = $state("100%");

  function handleResize() {
    // Get the actual visible height
    const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
    height = `${visibleHeight}px`;
  }

  onMount(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }
    handleResize();
  });

  onDestroy(() => {
    if (window.visualViewport) {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    }
  });

  async function handleSearch() {
    if (!librarySearchQuery.trim()) {
      searchData = [];
      return;
    }
    const result = await datafn.search({
      query: librarySearchQuery,
      resources: resolveProductResources($appStore.product, "search") ?? [
        Resource.node,
        Resource.collection
      ],
      limit: 150,
      limitPerResource: 150,
      source: "local"
    });
    searchData = result.results?.map((entry: any) => entry.data) ?? [];
  }
</script>

{#if isActive}
  <div
    class={cn("flex pb-3", {
      "fixed bottom-0 w-full h-[100dvh] z-100 bg-bgs1 flex-col justify-between pt-4 px-2":
        isSearchFocused
    })}
    in:fly={{ y: 10, duration: 300 }}
    style="height: {isSearchFocused ? height : ''}"
  >
    {#if isSearchFocused}
      <button
        class="flex min-h-0 flex-1 w-full overflow-y-auto"
        onclick={() => {
          searchRef.blur();
        }}
      >
        {#if librarySearchQuery}
          <Records
            data={searchData}
            accessPoint={ResourceAccessPoint.LIBRARY}
            size={Size.sm}
          />
        {:else if $recentsStore.recents && $recentsStore.recents.length > 0}
          {@const recentsData = recentsStore.resolve()}
          <Records
            data={recentsData}
            accessPoint={ResourceAccessPoint.LIBRARY}
            size={Size.sm}
          />
          <!-- <ScrollViewBottomSpacer /> -->
        {:else}
          <EmptyStatusView
            size={Size.sm}
            isSearchContext={true}
            mainText="No recents found"
          />
        {/if}
      </button>
    {/if}
    <div class="flex items-center gap-1 w-full">
      <InlineSearchBar
        bind:this={searchRef}
        bind:query={librarySearchQuery}
        padding="px-4"
        placeholder="Search library"
        onSearch={handleSearch}
        onFocus={() => {
          isSearchFocused = true;
        }}
        style={InputStyle.FILLED}
      ></InlineSearchBar>
      {#if isSearchFocused}
        <Button
          icon="cross"
          onclick={() => {
            isSearchFocused = false;
          }}
        />
      {/if}
    </div>
  </div>
{/if}
