<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import Icon from "@21n/elements/Icon.svelte";
  import { Placement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import type { IProperty, PropertyType } from "@nucleum/features/collections/properties/property.type";
  import PropertyTypeSelectorPopover from "@nucleum/features/collections/properties/propertyTypeSelector/PropertyTypeSelectorPopover.svelte";
  import { autoPropertyOptions, propertyOptions } from "@nucleum/features/collections/properties/property.store";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import {
    PropertyTypeGroup,
    PropertyTypeMode,
    type IPropertyTypeSelectorGroup
  } from "@nucleum/features/collections/properties/propertyTypeSelector/propertyTypeSelector.type";

  let {
    row,
    onChange
  }: {
    row: IProperty;
    onChange: (e: { id: IRecordId; type: PropertyType }) => void;
  } = $props();
  let isPopoverVisible = $state(false);
  let ref: HTMLDivElement;

  const groups: IPropertyTypeSelectorGroup[] = [
    {
      id: PropertyTypeGroup.TEXT,
      label: "",
      order: 0,
      mode: PropertyTypeMode.MANUAL
    },
    {
      id: PropertyTypeGroup.SELECT,
      label: "Select from options",
      order: 1,
      mode: PropertyTypeMode.MANUAL
    },
    {
      id: PropertyTypeGroup.WIZARD,
      label: "More",
      order: 2,
      mode: PropertyTypeMode.MANUAL
    },
    {
      id: PropertyTypeGroup.SYSTEM,
      label: "System",
      info: {
        body: "Property values are automatically created and updated by the system when the node entry is created or updated.",
        size: Size.xs
      },
      order: 1,
      mode: PropertyTypeMode.AUTO
    },
    {
      id: PropertyTypeGroup.RULE_BASED,
      label: "Rule based",
      order: 0,
      badge: "Planned",
      isDisabled: true,
      mode: PropertyTypeMode.AUTO
    }
  ];
  const options: DropdownItem[] = [...propertyOptions, ...autoPropertyOptions];
  let selected = $derived(options.find((option) => option.value === row.type));
</script>

<div
  class={cn(
    "flex w-full justify-between items-center gap-2 rounded-md border p-2 h-11",
    {
      "border-brs3": !isPopoverVisible,
      "border-aps1": isPopoverVisible
    }
  )}
  bind:this={ref}
  use:popover={{
    content: PropertyTypeSelectorPopover,
    placement: Placement.Right,
    id: `property-type-selector-popover-${row.id || "default"}`,
    componentProps: {
      groups,
      options,
      onSelect: (e) => {
        // if (e) row.type = e;
        onChange?.({ id: row.id, type: e });
        ref.dispatchEvent(new CustomEvent("hide"));
      }
    }
  }}
  onchange={(e) => {
    isPopoverVisible = e.detail?.open;
  }}
>
  <span class="flex items-center gap-1">
    {#if selected?.icon && typeof selected.icon === "string"}
      <Icon icon={selected.icon} size={Size.sm} />
    {/if}
    <span class="text-b2 whitespace-nowrap">
      {selected?.label}
    </span>
  </span>
  <Icon
    icon={isPopoverVisible ? "chevron-right" : "chevron-down"}
    size={Size.sm}
  />
</div>
