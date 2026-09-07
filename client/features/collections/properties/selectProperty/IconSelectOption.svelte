<script lang="ts">
  import { tooltip } from "@nucleum/actions/popover.action";
  import { cn } from "@21n/utils/ui.utils";
  import type { IPropertyConfigOption } from "@nucleum/features/collections/properties/property.type";
  let {
    option,
    value = null,
    onclick = undefined
  }: {
    option: IPropertyConfigOption;
    value?: string | string[] | null;
    onclick?: ((event: MouseEvent) => void) | undefined;
  } = $props();
  let isActive = $derived(Array.isArray(value)
    ? value.includes(option.id)
    : value === option.id);
</script>

<button
  class={cn("px-2 py-1.5 rounded-md border text-h4", {
    "bg-aps3 border-aps1": isActive,
    "border-brs2 hover:bg-bgs2": !isActive
  })}
  {onclick}
  use:tooltip={{
    text: option.label
  }}
>
  {option.icon}
</button>
