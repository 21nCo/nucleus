<script lang="ts">
  import { popover } from "@nucleum/actions/popover.action";
  import Divider from "@21n/elements/Divider.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import {
    iconSelectPropertyTypes,
    UniversalPropertyType,
    type IPropertyConfigOption,
    type IUniversalProperty
  } from "@nucleum/features/collections/properties/property.type";
  import { ColorStrength } from "@21n/types/appearance.type";
  import { Orientation } from "@21n/types/direction.enum";
  import { Size } from "@21n/types/size.enum";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { universalPropertyOptions } from "@nucleum/features/collections/properties/property.store";
  import { resolveUniversalPropertyOptions } from "@nucleum/features/collections/properties/property.utils";
  import UniversalPropertyConfigPopover from "@nucleum/features/collections/properties/propertyConfig/universalProperty/UniversalPropertyConfigPopover.svelte";
  let {
    property,
    isPopoverOpen = $bindable(false)
  }: {
    property: IUniversalProperty;
    isPopoverOpen?: boolean;
  } = $props();
  let ref: HTMLElement;
  let isIconSelectType = $derived(
    property.config?.type &&
      iconSelectPropertyTypes.includes(property.config.type)
  );
  let options = $derived.by(() =>
    property.config?.type
      ? resolveUniversalPropertyOptions(property.config.type)
      : []
  );

  function resolvePropertyIcon(type: UniversalPropertyType) {
    return (
      universalPropertyOptions.find((x) => x.value === type)?.icon ??
      "caret-circle-down"
    );
  }
</script>

<div
  class="rounded-md w-full flex items-center justify-between px-3 h-full"
  bind:this={ref}
  use:popover={{
    content: UniversalPropertyConfigPopover,
    isSpanToTriggerWidth: true,
    id: `universal-property-config-popover-${property.id || "default"}`,
    componentProps: {
      config: property.config,
      onChange: (e) => {
        if (e.type) {
          ref.dispatchEvent(new CustomEvent("hide"));
        }
        property = { ...property, config: { ...property.config, ...e } };
      }
    }
  }}
  onchange={(e) => {
    isPopoverOpen = e.detail?.open;
  }}
>
  <span class="flex items-center gap-2">
    {#if property.config?.type && property.config?.type !== UniversalPropertyType.NONE}
      <Icon
        icon={property.config?.isMultiSelect
          ? "ph:list-bullets-light"
          : resolvePropertyIcon(property.config.type)}
        size={Size.sm}
      />
      <span class="whitespace-nowrap">
        {enumToString(property.config?.type)}
      </span>
    {:else}
      <span class="text-b2 placeholder"> Please select sub type </span>
    {/if}
  </span>
  <Icon
    icon={isPopoverOpen ? "chevron-up" : "chevron-down"}
    size={Size.sm}
  />
  {#if property.config?.type && property.config?.type !== UniversalPropertyType.NONE}
    <span class="flex gap-2 items-center w-1/2 h-full">
      <Divider
        orientation={Orientation.Vertical}
        colorStrength={ColorStrength.Strong}
      />
      {#if isIconSelectType}
        <div class="flex text-b2 justify-around w-full">
          {#each options as icon}
            <span>
              {icon.icon}
            </span>
          {/each}
        </div>
      {:else}
        <span class="text-b3 text-fgs3">
          {options.length}
          {options.length === 1 ? "option" : "options"}
        </span>
      {/if}
    </span>
  {/if}
</div>
