<script lang="ts">
  import CheckboxInput from "@21n/elements/toggle/CheckboxInput.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import {
    type IProperty,
    PropertyType
  } from "@nucleum/features/collections/properties/property.type";
  import EndText from "@nucleum/features/collections/properties/propertyConfig/EndText.svelte";
  import RatingPropertyConfig from "@nucleum/features/collections/properties/ratingProperty/config/RatingPropertyConfig.svelte";
  import SelectPropertyConfig from "@nucleum/features/collections/properties/propertyConfig/selectProperty/SelectPropertyConfig.svelte";
  import UniversalPropertyConfig from "@nucleum/features/collections/properties/propertyConfig/universalProperty/UniversalPropertyConfig.svelte";
  let {
    row,
    onRowPatch = undefined
  }: {
    row: IProperty;
    onRowPatch?: ((patch: Partial<IProperty>) => void) | undefined;
  } = $props();
  let dev_isEnableDefaultSelection: boolean = false;
  let isPopoverOpen = $state(false);
  let propertyTypesWithConfiguration = [
    PropertyType.SINGLE_SELECT,
    PropertyType.MULTI_SELECT,
    PropertyType.RATING,
    PropertyType.UNIVERSAL
  ];
</script>

{#if propertyTypesWithConfiguration.includes(row.type)}
  <div
    class={cn("rounded-md w-full border flex items-center h-11", {
      "border-aps1": isPopoverOpen,
      "border-brs3": !isPopoverOpen
    })}
  >
    {#if row.type === PropertyType.SINGLE_SELECT || row.type === PropertyType.MULTI_SELECT}
      <SelectPropertyConfig
        property={row}
        bind:isPopoverOpen
        onConfigChange={(event) => {
          const patch = {
            config: event.detail.config,
            defaultValue: event.detail.defaultValue
          };
          Object.assign(row, patch);
          onRowPatch?.(patch);
        }}
      />
    {:else if row.type === PropertyType.UNIVERSAL}
      <UniversalPropertyConfig property={row} bind:isPopoverOpen />
    {:else if row.type === PropertyType.RATING}
      <RatingPropertyConfig property={row} />
    {:else if row.type === PropertyType.CHECKBOX && dev_isEnableDefaultSelection && (typeof row.defaultValue === "boolean" || row.defaultValue === null || row.defaultValue === undefined)}
      <span class="flex items-center justify-between w-full">
        <CheckboxInput
          label={row.defaultValue ? "Checked" : "Unchecked"}
          bind:checked={row.defaultValue}
        />
        <EndText text="Default" />
      </span>
    {/if}
  </div>
{:else}
  <span class="flex w-full items-center text-fgs3 text-b2">NA</span>
{/if}
