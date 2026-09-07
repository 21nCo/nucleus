<script lang="ts">
  import DropDown from "@21n/elements/dropdown/DropDown.svelte";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import type {
    FieldMappingConfig,
    FieldMappingValue,
    FieldMappingField
  } from "@nucleum/products/memotron/import/data.type";
  import { Size } from "@21n/elements/size.enum";

  let {
    fieldMappingConfig,
    fieldMappings = $bindable({}),
    onMappingChange = undefined
  }: {
    fieldMappingConfig: FieldMappingConfig;
    fieldMappings?: Record<string, string>;
    onMappingChange?:
      | ((detail: { field: string; value: string }) => void)
      | undefined;
  } = $props();

  function handleMappingChange(field: string, value: string) {
    fieldMappings[field] = value;
    onMappingChange?.({ field, value });
  }

  function getDropdownItems(options: FieldMappingValue[]): DropdownItem[] {
    return options.map((option) => ({
      value: option.value,
      label: option.label
    }));
  }
</script>

<div class="p-4 border border-brs2 rounded-lg flex-grow flex flex-col w-full">
  <div class="mb-4">
    <h3 class="text-b2 font-medium mb-2">Configure field mapping</h3>
    <p class="text-fgs2 text-b3">
      Please select appropriate mapping for each field.
    </p>
  </div>

  <div class="space-y-4 flex-grow w-full">
    {#each Object.entries(fieldMappingConfig) as [fieldKey, fieldConfig]}
      <div class="p-3 border border-brs3 rounded-md bg-bgs2">
        <div class="mb-2">
          <div class="text-b3 font-medium">{fieldConfig.label}</div>
          {#if fieldConfig.description}
            <p class="text-fgs3 text-b4 mt-1">{fieldConfig.description}</p>
          {/if}
        </div>

        <DropDown
          value={fieldMappings[fieldKey] || fieldConfig.defaultValue}
          items={getDropdownItems(fieldConfig.options)}
          isDisableSearch={true}
          size={Size.sm}
          onSelect={(e) => handleMappingChange(fieldKey, String(e.detail))}
          width="w-full"
        />
      </div>
    {/each}
  </div>
</div>
