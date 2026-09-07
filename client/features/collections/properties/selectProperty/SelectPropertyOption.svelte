<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import CustomColorPropagator from "@21n/elements/style/CustomColorPropagator.svelte";
  import type { IPropertyConfigOption } from "@nucleum/features/collections/properties/property.type";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import Icon from "@21n/elements/Icon.svelte";
  let {
    item,
    isSelectedContext = false,
    isSelected = false,
    isPreventTagStyle = false,
    onclick = undefined
  }: {
    item: IPropertyConfigOption;
    isSelectedContext?: boolean;
    isSelected?: boolean;
    isPreventTagStyle?: boolean;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
</script>

<button
  class={cn("text-left text-b2 flex justify-between", {
    "bg-bgs3": isSelected && !isSelectedContext,
    "py-1.5 hover:bg-bgs3 px-3 w-full": !isSelectedContext
  })}
  {onclick}
>
  {#if isPreventTagStyle}
    {item ? (isValidString(item?.label) ? item?.label : "Untitled") : "None"}
  {:else}
    <CustomColorPropagator
      color={item?.color}
      class={cn("px-4 py-0.5 rounded-md w-fit bg-ccs3 whitespace-nowrap")}
    >
      {item ? (isValidString(item?.label) ? item?.label : "Untitled") : "None"}
    </CustomColorPropagator>
  {/if}
  {#if isSelected}
    <Icon icon="check" class="text-fgs3" />
  {/if}
</button>
