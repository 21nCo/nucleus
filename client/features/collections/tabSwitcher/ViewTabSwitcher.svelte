<script lang="ts">
  import {
    isNoneResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import {
    calculateGroupingCounts,
    resolveOptionsForGrouping
  } from "@nucleum/features/collections/collection.utils";
  import type {
    ICollectionItem,
    ICollectionView
  } from "@nucleum/features/collections/collection.type";
  import type { ISelectItem, ISelectValue } from "@21n/types/select.type";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import ViewTabs from "@nucleum/features/collections/tabSwitcher/ViewTabs.svelte";

  let {
    view,
    properties = [],
    data = [],
    value = $bindable(),
    onSelect = undefined
  }: {
    view: ICollectionView;
    properties?: IProperty[];
    data?: ICollectionItem[];
    value?: ISelectValue | undefined;
    onSelect?: ((event: CustomEvent<ISelectValue>) => void) | undefined;
  } = $props();
  let viewData = $derived(data ?? []);
  let label = $derived(resolveLabel(view.tabBy));
  let tabCounts = $derived(calculateGroupingCounts(viewData, view.tabBy));
  let tabs = $derived.by(() => resolveTabs(view.tabBy));

  function resolveTabs(tabBy: string) {
    if (isNoneResource(tabBy)) return [];
    if (view.tabs) return view.tabs;
    const allTab = {
      label: "All",
      value: "all"
    };
    const options = resolveOptionsForGrouping(tabBy, properties, tabCounts);
    return [allTab, ...options];
  }
  function resolveLabel(tabBy: string) {
    if (!view.tabBy || !properties) return "";
    const property = properties.find(resourceInList(tabBy));
    return property?.label ?? "";
  }
</script>

{#if label && tabs}
  <div
    class="flex mo:flex-col mo:items-start mo:gap-2 gap-4 items-center w-full"
  >
    <span class="text-fgs2 text-b2 min-w-fit whitespace-nowrap">{label}</span>
    {#if tabs && tabs.length > 0}
      <ViewTabs {tabs} bind:selected={value} {tabCounts} {onSelect} />
    {/if}
  </div>
{/if}
