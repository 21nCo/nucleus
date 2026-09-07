<script lang="ts">
  import type {
    IResourceSwitchItem,
    ISelectValue
  } from "@21n/types/select.type";
  import ResourceSwitcherItem from "@nucleum/components/library/resourceSwitcher/ResourceSwitcherItem.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { appStore } from "@nucleum/stores/app.store";
  import { Product } from "@21n/types/product.type";
  import { resolveProductConfig } from "@nucleum/products/product.config";
  import { resolveResourceSwitcher } from "@nucleum/datafn/resource.utils";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import { properCase } from "@21n/shared-utils/text.utils";
  import {
    nextProductSectionsPre,
    nextProductSectionsPost
  } from "@nucleum/next/product.config";
  import { rootNodeTypeList } from "@nucleum/features/memory/node/node.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteDataStore } from "@datafn/svelte";
  import { datafnHeavyComputedSignalOptions } from "@nucleum/datafn/signalCache";
  let {
    resources = [],
    selected = undefined,
    parentBgIndex = 1,
    isShowCount = false,
    onSelect = undefined
  }: {
    resources?: Resource[];
    selected?: Resource | undefined;
    parentBgIndex?: number;
    isShowCount?: boolean;
    onSelect?: ((value: Resource) => void) | undefined;
  } = $props();

  const resourceList: IResourceSwitchItem[] = resolveResourceSwitcher();

  let selectedValue = $state<Resource | undefined>(undefined);
  const isDev = import.meta.env.DEV;

  let options = $derived(
    resources.map((x) => {
      const resource = resourceList.find((y) => y.value === x);
      if (!resource) return { label: x, value: x, icon: "circle" };
      return resource;
    })
  );

  const isProductSection = (value: string): value is Product =>
    Object.values(Product).includes(value as Product);

  let sections = [
    Product.NUCLEUM,
    Product.POINTRON,
    ...nextProductSectionsPre,
    Product.MEMOTRON,
    ...nextProductSectionsPost
  ].filter(isProductSection);
  $effect(() => {
    selectedValue = selected ?? (options[0]?.value as Resource | undefined);
  });
  const nucleusResources = resolveProductConfig(Product.NUCLEUM).resources
    .browse;
  function resolveResourcesForSection(section: Product): IResourceSwitchItem[] {
    const resources = resolveProductConfig(section).resources.browse;
    return resources
      .map((x) => resourceList.find((y) => y.value === x))
      .filter((x) => isDev || !x?.isDisabled)
      .filter(
        (x) =>
          section === Product.NUCLEUM ||
          !nucleusResources.includes(x?.value as Resource)
      )
      .filter((x) => x !== undefined);
  }

  function resolveSectionLabel(section: Product) {
    return (
      resolveProductConfig(section).librarySectionLabel ?? properCase(section)
    );
  }

  const countResources = $derived.by(() => {
    const items =
      $appStore.product === Product.NUCLEUM
        ? sections.flatMap(resolveResourcesForSection)
        : options;
    return [
      ...new Set(
        items
          .map((item) =>
            item.value === Resource.relation ? Resource.linkTag : item.value
          )
          .filter((resource): resource is Resource =>
            [
              Resource.node,
              Resource.collection,
              Resource.space,
              Resource.objective,
              Resource.task,
              Resource.event,
              Resource.linkTag
            ].includes(resource as Resource)
          )
      )
    ];
  });
  const countStore = $derived.by(() =>
    toSvelteDataStore(
      datafn.resourceCountsSignal(
        {
          resources: isShowCount ? countResources : [],
          queriesByResource: {
            [Resource.node]: {
              filters: {
                contentType: { $in: [...rootNodeTypeList] },
                metaType: { $is_empty: true },
                creationContext: { $is_empty: true }
              }
            },
            [Resource.objective]: {
              filters: {
                parentId: { $is_empty: true }
              }
            }
          }
        },
        datafnHeavyComputedSignalOptions
      ),
      { initialData: {} }
    )
  );

  function resolveCount(resource: Resource) {
    const countResource =
      resource === Resource.relation ? Resource.linkTag : resource;
    return $countStore[countResource] ?? 0;
  }
</script>

{#if $appStore.product === Product.NUCLEUM}
  <div class="flex flex-col gap-12 w-full overflow-y-auto">
    {#each sections as section (section)}
      {@const items = resolveResourcesForSection(section)}
      <div class="flex flex-col gap-2">
        {#if section !== Product.NUCLEUM && items.length > 0}
          <div class="text-fgs3 text-b2">
            {resolveSectionLabel(section)}
          </div>
        {/if}
        <div
          class="w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] mo:mb-1 gap-2"
        >
          {#each items as item (item.value)}
            <ResourceSwitcherItem
              {item}
              {isShowCount}
              count={resolveCount(item.value as Resource)}
              {parentBgIndex}
              isActive={selectedValue === item.value}
              onClick={() => {
                if (item.isDisabled) return;
                selectedValue = item.value as Resource;
                onSelect?.(item.value as Resource);
              }}
            />
          {/each}
        </div>
      </div>
    {/each}
    <ScrollViewBottomSpacer />
  </div>
{:else}
  <div
    class="w-full grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] mo:mb-1 gap-3"
  >
    {#each options as item (item.value)}
      <ResourceSwitcherItem
        {item}
        {isShowCount}
        count={resolveCount(item.value as Resource)}
        {parentBgIndex}
        isActive={selectedValue === item.value}
        onClick={() => {
          if (item.isDisabled) return;
          selectedValue = item.value as Resource;
          onSelect?.(item.value as Resource);
        }}
      />
    {/each}
  </div>
{/if}
