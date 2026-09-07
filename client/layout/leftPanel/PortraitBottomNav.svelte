<svelte:options runes={true} />

<script lang="ts">
  import AppMenuSwitcher from "@21n/layout/leftPanel/appMenuSwitcher/AppMenuSwitcher.svelte";
  import { LayoutContext } from "@21n/types/layout.type";
  import { player } from "@nucleum/application/modal/modal.store";
  import ComponentResolver from "@21n/layout/paint/ComponentResolver.svelte";
  import { page } from "$app/stores";
  import { cn } from "@21n/utils/ui.utils";
  import LibrarySearchPortrait from "@nucleum/products/memotron/library/search/LibrarySearchPortrait.svelte";
  import { onMount } from "svelte";

  let testingInMobileBrowser: boolean = false;
  let isSearchFocused = $state(false);
  let dev_isAppNavLibrarySearch: boolean = false;
  let currentRouteParam = $state<string | undefined>(undefined);
  let currentRouteId = $state<string | undefined>(undefined);
  let isLibraryActive = $derived(
    Boolean(
      currentRouteParam?.includes("library") ||
        currentRouteId?.includes("library")
    )
  );

  onMount(() => {
    const unsubscribe = page.subscribe((p) => {
      currentRouteParam = p?.params?.route;
      currentRouteId = p?.route?.id ?? undefined;
    });
    return () => unsubscribe?.();
  });
</script>

<div
  class="absolute {testingInMobileBrowser
    ? 'bottom-14'
    : 'bottom-0'} flex flex-col justify-center items-center z-30 w-full"
>
  {#if $player.isMiniOn}
    <ComponentResolver path={$player.action} />
  {/if}

  <div
    class={cn(
      "w-full min-w-min pb-8 pt-3 glassmenubar bg-bgs1 border-t border-brs2",
      {
        "rounded-t-[1rem]": dev_isAppNavLibrarySearch && isLibraryActive
      }
    )}
  >
    {#if dev_isAppNavLibrarySearch}
      <LibrarySearchPortrait isActive={isLibraryActive} bind:isSearchFocused />
    {/if}
    {#if !isSearchFocused}
      <AppMenuSwitcher
        layoutContext={LayoutContext.PORTRAIT}
        parentBackgroundIndex={0}
      />
    {/if}
  </div>
</div>
