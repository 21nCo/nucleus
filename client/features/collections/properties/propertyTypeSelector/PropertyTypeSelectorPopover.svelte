<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import Badge from "@21n/elements/text/Badge.svelte";
  import type {
    DropdownGroup,
    DropdownItem
  } from "@21n/elements/dropdown/dropdownItem.type";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { PanelSwitcherStyle } from "@21n/elements/switcher/switcher.enum";
  import {
    PropertyTypeMode,
    type IPropertyTypeSelectorGroup
  } from "@nucleum/features/collections/properties/propertyTypeSelector/propertyTypeSelector.type";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { Placement } from "@21n/elements/direction.enum";
  let {
    groups,
    options,
    onSelect
  }: {
    groups: IPropertyTypeSelectorGroup[];
    options: DropdownItem[];
    onSelect: (e: string) => void;
  } = $props();
  let mode = $state<PropertyTypeMode>(PropertyTypeMode.MANUAL);
  let _groups = $derived(groups.filter((group) => group.mode === mode));
</script>

<div
  class="flex flex-col gap-3 bg-bgs1 border border-brs2 rounded-md py-4 px-1 w-72 max-h-full overflow-y-auto"
>
  <div class="flex flex-col gap-3 px-3">
    <!-- <Text
      content="Choose property type"
      style={TextStyle.SECTION_HEADING}
    /> -->
    <div class="flex justify-center">
      <PanelSwitcher
        items={[
          {
            label: "Manual",
            value: PropertyTypeMode.MANUAL
          },
          {
            label: "Auto",
            value: PropertyTypeMode.AUTO
          }
        ]}
        size={Size.sm}
        style={PanelSwitcherStyle.TRAIN}
        bind:value={mode}
      />
    </div>
  </div>
  {#each _groups as group}
    {@const groupOptions = options.filter(
      (option) => option.groupId === group.id
    )}
    <div>
      <span class="flex items-center gap-1 px-3">
        <Text content={group.label} style={TextStyle.SECTION_HEADING_SMALL} />
        {#if group.info}
          <FormLabelTooltip info={group.info} />
        {/if}
        {#if group.badge}
          <Badge text={group.badge} />
        {/if}
      </span>
      {#each groupOptions as option}
        <button
          class={cn(
            "relative flex items-center justify-between gap-2 px-3 py-2 rounded-md w-full",
            {
              "text-fgs3 cursor-not-allowed": option.isDisabled,
              "hover:bg-bgs2": !option.isDisabled
            }
          )}
          use:tooltip={{
            disabled: !option.tooltip,
            text: option.tooltip,
            direction: Placement.Bottom
          }}
          onclick={() => {
            if (option.isDisabled) return;
            onSelect(option.value);
          }}
        >
          <span class="flex items-center gap-2">
            {#if option.icon && typeof option.icon === "string"}
              <Icon
                icon={option.icon}
                size={Size.sm}
                class={option.isDisabled ? "text-fgs3" : ""}
              />
            {/if}
            <span class="whitespace-nowrap text-b2">
              {option.label}
            </span>
          </span>
          {#if option.badge}
            <Badge text={option.badge} />
          {/if}
        </button>
      {/each}
    </div>
  {/each}
</div>
