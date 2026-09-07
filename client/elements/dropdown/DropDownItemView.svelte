<script lang="ts">
  import type { MouseEventHandler } from "svelte/elements";
  import type { DropdownItem } from "@21n/elements/dropdown/dropdownItem.type";
  import { Size } from "@21n/elements/size.enum";
  import { properCase } from "@21n/shared-utils/text.utils";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import Badge from "@21n/elements/text/Badge.svelte";
  let {
    item,
    onclick = undefined
  }: {
    item: DropdownItem;
    onclick?: MouseEventHandler<HTMLButtonElement> | undefined;
  } = $props();

  function resolveLabel() {
    return item.label ?? properCase(String(item.value));
  }
</script>

<button
  class={cn("text-left px-3 py-2 hover:bg-bgs2 w-full", {
    "text-fgs3 cursor-not-allowed": item.isDisabled
  })}
  onclick={(event) => onclick?.(event)}
>
  <div class="flex items-center justify-between gap-2">
    <span class="flex items-center gap-2">
      {#if item.icon && typeof item.icon === "string"}
        <Icon icon={item.icon} size={Size.sm} />
      {/if}
      <span class="whitespace-nowrap">
        {resolveLabel()}
      </span>
    </span>
    {#if item.badge}
      <Badge text={item.badge} />
    {/if}
  </div>
</button>
