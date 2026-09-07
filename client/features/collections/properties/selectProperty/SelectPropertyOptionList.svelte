<script lang="ts">
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import type { IPropertyConfigOption } from "@nucleum/features/collections/properties/property.type";
  import SelectPropertyOption from "@nucleum/features/collections/properties/selectProperty/SelectPropertyOption.svelte";
  let {
    options,
    value,
    isMultiSelect = false,
    groupId = undefined,
    groupLabel = undefined,
    isPreventDefaultGroupLabel = false,
    isPreventTagStyle = false,
    onSelect = undefined
  }: {
    options: IPropertyConfigOption[];
    value: string | string[];
    isMultiSelect?: boolean;
    groupId?: string | undefined;
    groupLabel?: string | undefined;
    isPreventDefaultGroupLabel?: boolean;
    isPreventTagStyle?: boolean;
    onSelect?: ((event: CustomEvent<string>) => void) | undefined;
  } = $props();
  let filtered = $derived(resolveItems(groupId));
  function resolveItems(groupId: string | undefined) {
    if (groupId) {
      return options.filter((x) => x.groupId === groupId);
    } else {
      return options.filter((x) => !x.groupId);
    }
  }
</script>

{#if isValidArrayWithData(filtered)}
  <div class="flex flex-col w-full">
    {#if !isPreventDefaultGroupLabel}
      <div class="flex gap-1 text-b3 text-fgs3 px-3 mb-1">
        {groupLabel ?? "Ungrouped"}
      </div>
    {/if}

    {#each filtered as item (item.id)}
      <SelectPropertyOption
        {item}
        {isPreventTagStyle}
        isSelected={isMultiSelect &&
          isValidArrayWithData(value) &&
          value.includes(item.id)}
        onclick={() => {
          onSelect?.(
            new CustomEvent("select", {
              detail: item.id
            })
          );
        }}
      />
    {/each}
  </div>
{/if}
