<script lang="ts">
  import type { Snippet } from "svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import {
    OptionSelectorStyle,
    type ISelectItem
  } from "@21n/types/select.type";
  import { Size } from "@21n/types/size.enum";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { resolveObjectiveSubTypesForSwitcher } from "@nucleum/features/focus/goals/goal.utils";
  import { resolveTaskSubTypesForSwitcher } from "@nucleum/features/focus/tasks/task.utils";
  import { resolveNodeSubTypesForSwitcher } from "@nucleum/features/memory/node/node.utils";
  import { resolveCollectionSubTypesForSwitcher } from "@nucleum/features/collections/collection.utils";
  import type { NodeType } from "@nucleum/features/memory/node/node.type";
  import type { CollectionType } from "@nucleum/features/collections/collection.type";
  import view from "@nucleum/stores/view.store";
  import { Orientation } from "@21n/types/direction.enum";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import type { SubType } from "@nucleum/components/library/library.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { cn } from "@21n/utils/ui.utils";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { BarStyle, PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import { AppSearchParam } from "@21n/types/appStore.type";
  import { page } from "$app/stores";
  import { fade } from "svelte/transition";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  let {
    resource,
    isConstrainedWidth = $view.isConstrainedWidth,
    accessPoint,
    subContext = undefined,
    selectedSubType = "all",
    children = undefined
  }: {
    resource: Resource;
    isConstrainedWidth?: boolean;
    accessPoint: ResourceAccessPoint;
    subContext?: string | undefined;
    selectedSubType?: SubType;
    children?: Snippet | undefined;
  } = $props();

  const nodeSubTypesForSwitcher = resolveNodeSubTypesForSwitcher();
  const collectionSubTypesForSwitcher = resolveCollectionSubTypesForSwitcher();
  const goalSubTypesForSwitcher = resolveObjectiveSubTypesForSwitcher(true);
  const taskSubTypesForSwitcher = resolveTaskSubTypesForSwitcher();
  const allSubTypeSwitcherItem = {
    label: "All",
    value: "all",
    icon: "asterisk"
  };
  let isExpandSubTypes = $state(false);
  let refreshTick = $state(0);
  let isStarFilterSelected = $state(
    $page.url.searchParams.get(AppSearchParam.STARRED) ? true : false
  );
  let isArchivedFilterSelected = $state(
    $page.url.searchParams.get(AppSearchParam.ARCHIVED) ? true : false
  );

  let isExpandableSubTypes = $derived([Resource.node].includes(resource));
  let isNonStarrable = $derived([Resource.task].includes(resource));
  let isNonArchivable = $derived([Resource.task].includes(resource));
  const subTypeCountsStore = $derived.by(() => {
    refreshTick;
    if (!isExpandableSubTypes || isConstrainedWidth) return undefined;
    const groupField = resolveGroupField(resource);
    return toSvelteStore<{ groups?: any[] }>(
      datafn.table(resource).signal({
        filters: {
          ...resolveBaseFilters(),
          ...(resource === Resource.node
            ? {
                metaType: { $is_empty: true }
              }
            : {})
        },
        metadata: resolveQueryMetadata(),
        groupBy: [groupField],
        aggregations: { total: { op: "count", field: "*" } }
      }),
      { initialData: { groups: [] } }
    );
  });
  const subTypeCounts = $derived(
    resolveSubTypeCounts(
      resource,
      subTypeCountsStore ? ($subTypeCountsStore!.data.groups ?? []) : []
    )
  );
  const allSubTypes = $derived(resolveAllSubTypes(resource, subTypeCounts));
  const renderedSubTypes = $derived(resolveRenderedSubTypes(allSubTypes));

  export function refresh() {
    refreshTick += 1;
  }

  $effect(() => {
    isStarFilterSelected = Boolean(
      $page.url.searchParams.get(AppSearchParam.STARRED)
    );
    isArchivedFilterSelected = Boolean(
      $page.url.searchParams.get(AppSearchParam.ARCHIVED)
    );
  });

  function resolveBaseFilters() {
    if (
      !(
        isStarFilterSelected ||
        selectedSubType === "starred" ||
        isArchivedFilterSelected
      )
    ) {
      return;
    }
    return {
      isStarred:
        isStarFilterSelected || selectedSubType === "starred"
          ? true
          : undefined,
      isArchived: isArchivedFilterSelected ? true : undefined
    };
  }

  function resolveQueryMetadata() {
    return isArchivedFilterSelected ? { includeArchived: true } : undefined;
  }

  function resolveSubItems(resource: Resource) {
    const items: ISelectItem[] = [allSubTypeSwitcherItem];
    if (isConstrainedWidth && isExpandableSubTypes) return items;
    if (resource === Resource.node) {
      items.push(...nodeSubTypesForSwitcher);
    } else if (resource === Resource.collection) {
      items.push(...collectionSubTypesForSwitcher);
    } else if (resource === Resource.objective) {
      items.push(...goalSubTypesForSwitcher);
    } else if (resource === Resource.task) {
      items.push(...taskSubTypesForSwitcher);
    }
    return items;
  }

  function resolveAllSubTypes(
    resource: Resource,
    subTypeCounts: Map<NodeType | CollectionType, number>
  ) {
    const items = resolveSubItems(resource);
    if (!isExpandableSubTypes || isConstrainedWidth) return items;
    return items.map((x) => {
      const count = subTypeCounts.get(
        x.value.toString().toUpperCase() as NodeType | CollectionType
      );
      return {
        ...x,
        badge: count ? count : undefined
      };
    });
  }

  function resolveRenderedSubTypes(allSubTypes: ISelectItem[]) {
    if (isConstrainedWidth || !isExpandableSubTypes || isExpandSubTypes) {
      return [...allSubTypes];
    }
    const renderedSubTypes = [...allSubTypes]
      .filter(
        (x) =>
          x.value === "all" ||
          (x.badge && typeof x.badge === "number" && x.badge > 0)
      )
      ?.sort((a, b) => +(b.badge ?? 0) - +(a.badge ?? 0));
    renderedSubTypes.pop();
    renderedSubTypes.unshift(allSubTypeSwitcherItem);
    return renderedSubTypes;
  }

  function resolveGroupField(resource: Resource) {
    return resource === Resource.node ? "contentType" : "type";
  }

  function resolveSubTypeCounts(resource: Resource, groups: any[]) {
    const groupField = resource === Resource.node ? "contentType" : "type";
    return new Map(
      groups.map((group: any) => [group[groupField], group.total])
    );
  }

  function onSelect(val: SubType) {
    if (subContext) {
      appStore.toggleSearchParam({
        [`${subContext}-${AppSearchParam.TYPE}`]: val.toLowerCase()
      });
    } else {
      appStore.toggleSearchParam({
        [AppSearchParam.TYPE]: val.toLowerCase()
      });
    }
  }

</script>

{#if isConstrainedWidth}
  <div class="flex gap-2 items-center justify-between">
    <div class="flex-1 min-w-0">
      <OptionSelector
        size={Size.sm}
        options={renderedSubTypes}
        selected={selectedSubType}
        isPreventWrap={true}
        onSelect={(e) => {
          if (!e?.detail) return;
          onSelect(e.detail);
        }}
      />
    </div>
    {@render children?.()}
  </div>
{:else}
  <div
    class={cn("flex gap-2 min-h-fit w-full", {
      "px-4": accessPoint === ResourceAccessPoint.LIBRARY
    })}
    in:fade={{ duration: 200 }}
  >
    <div class="flex-1 min-w-0">
      {#if resource === Resource.task}
        {#if renderedSubTypes.length > 0}
          <PanelSwitcher
            items={renderedSubTypes.map((x) => ({
              label: x.label,
              value: x.value
            }))}
            value={selectedSubType}
            size={Size.sm}
            style={PanelSwitcherStyle.BAR}
            barStyle={BarStyle.DOT}
            onSwitch={(e) => {
              if (!e?.detail) return;
              onSelect(e.detail);
            }}
          />
        {/if}
      {:else}
        <div class="flex gap-2 items-center h-full">
          {#if !isNonStarrable}
            <Toggle
              bind:on={isStarFilterSelected}
              icon="star"
              tooltip="Show starred items"
              bgSize={Size.sm}
              onChange={() => {
                if (isStarFilterSelected) {
                  appStore.toggleSearchParam({
                    [AppSearchParam.STARRED]: isStarFilterSelected
                  });
                } else {
                  appStore.toggleSearchParam([AppSearchParam.STARRED]);
                }
              }}
            />
            <Divider orientation={Orientation.Vertical} />
          {/if}
          <div class="flex-1 min-w-0">
            <OptionSelector
              style={OptionSelectorStyle.OUTLINE}
              size={Size.sm}
              options={renderedSubTypes}
              selected={selectedSubType}
              isPreventWrap={isExpandableSubTypes && !isExpandSubTypes}
              onSelect={(e) => {
                if (!e?.detail) return;
                onSelect(e.detail);
              }}
            />
          </div>
        </div>
      {/if}
    </div>
    {#if !isExpandSubTypes && resource === Resource.node}
      <Divider orientation={Orientation.Vertical} />
    {/if}
    <div class="flex items-center gap-1">
      {#if !isExpandSubTypes}
        {#if !isNonArchivable}
          <Toggle
            bind:on={isArchivedFilterSelected}
            icon="archive"
            tooltip="Show archived items"
            onChange={() => {
              if (isArchivedFilterSelected) {
                appStore.toggleSearchParam({
                  [AppSearchParam.ARCHIVED]: isArchivedFilterSelected
                });
              } else {
                appStore.toggleSearchParam([AppSearchParam.ARCHIVED]);
              }
            }}
            bgSize={Size.sm}
          />
        {/if}
      {/if}
      {@render children?.()}
      {#if isExpandableSubTypes}
        <Toggle
          bind:on={isExpandSubTypes}
          icon={isExpandSubTypes ? "chevron-left" : "chevron-down"}
          tooltip="Show all sub types"
          bgSize={Size.sm}
        />
      {/if}
    </div>
  </div>
{/if}
