<script lang="ts">
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import type { InputLabel } from "@21n/elements/input/input.type";
  import {
    CollectionLayout,
    type ICollectionView
  } from "@nucleum/features/collections/collection.type";
  import { Size } from "@21n/elements/size.enum";
  import { collectionLayoutOptions } from "@nucleum/features/collections/collection.store";
  import Badge from "@21n/elements/text/Badge.svelte";
  import MultiselectDropdown from "@21n/elements/dropdown/MultiselectDropdown.svelte";

  let {
    view,
    properties,
    onChange = undefined
  }: {
    view: ICollectionView;
    properties: DropdownItem[];
    onChange?: ((event: CustomEvent<{ key: string; value: unknown }>) => void) | undefined;
  } = $props();
  const dropdownSettings: {
    isDisableSearch: boolean;
    width: string;
    size: Size.md | Size.sm;
  } = {
    isDisableSearch: true,
    width: "w-60",
    size: Size.md
  };
  const dropdownLabelConfig: InputLabel = {
    label: "",
    isShrink: true,
    orientation: Orientation.Vertical
  };
  function onSelect(key: string, e: CustomEvent) {
    onChange?.(
      new CustomEvent("change", {
        detail: {
          key,
          value: e.detail
        }
      })
    );
  }

  function onLayoutSelect(event: CustomEvent) {
    onSelect("layout", event);
  }

  function onPropertiesSelect(event: CustomEvent) {
    onSelect("properties", event);
  }

  function onTabBySelect(event: CustomEvent) {
    onSelect("tabBy", event);
  }

  function onGroupBySelect(event: CustomEvent) {
    onSelect("groupBy", event);
  }

  function onSubGroupBySelect(event: CustomEvent) {
    onSelect("subGroupBy", event);
  }
</script>

<div
  class="flex flex-col gap-8 bg--bgs2 bg-opacity-50 border border-dashed border-fgs4 rounded-md px-4 py-6 text-left"
>
  <div class="flex flex-wrap gap-6 w-full">
    <!-- <DropDown
      label={{ ...dropdownLabelConfig, label: "Layout" }}
      {...dropdownSettings}
      items={collectionLayoutOptions}
      bind:value={view.layout}
      onSelect={onLayoutSelect}
    /> -->
    <div class="w-60">
      <MultiselectDropdown
        options={properties}
        selected={view.properties?.map((x) => x.toString()) ?? []}
        label={{
          ...dropdownLabelConfig,
          label: "Properties shown"
        }}
        onSelect={onPropertiesSelect}
      />
    </div>
    <DropDown
      label={{ ...dropdownLabelConfig, label: "Tabs" }}
      {...dropdownSettings}
      items={properties}
      value={view.tabBy.toString()}
      onSelect={onTabBySelect}
    />
    {#if view.layout === CollectionLayout.BOARD}
      <DropDown
        label={{ ...dropdownLabelConfig, label: "Group by" }}
        {...dropdownSettings}
        items={properties}
        value={view.groupBy.toString()}
        onSelect={onGroupBySelect}
      />
      <DropDown
        label={{ ...dropdownLabelConfig, label: "Sub group by" }}
        {...dropdownSettings}
        items={properties}
        value={view.subGroupBy.toString()}
        onSelect={onSubGroupBySelect}
      />
    {/if}
  </div>
  <div class="flex flex-row gap-2 items-center">
    <Badge text="soon" />
    <span class="text-fgs3 text-b3">
      More views like table view, filter and sorting options will be available
      soon.
    </span>
  </div>
</div>
