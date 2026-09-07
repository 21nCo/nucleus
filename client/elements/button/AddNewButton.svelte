<script lang="ts">
  import type { MouseEventHandler } from "svelte/elements";
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/types/size.enum";
  import view from "@nucleum/stores/view.store";
  let {
    text = "Add new",
    size = Size.md,
    class: className = "",
    onclick = undefined
  }: {
    text?: string;
    size?: Size.xs | Size.sm | Size.md | Size.lg;
    class?: string;
    onclick?: MouseEventHandler<HTMLButtonElement> | undefined;
  } = $props();
  const addText = $derived($view.isConstrainedWidth ? "" : text);
  let isHoveringOnAddNewItem = false;
</script>

<button
  onclick={(event) => onclick?.(event)}
  class={cn("flex items-center hover:text-aps1 gap-1", className)}
  onmouseenter={() => (isHoveringOnAddNewItem = true)}
  onmouseleave={() => (isHoveringOnAddNewItem = false)}
>
  <Icon
    icon="plus"
    {size}
    class={cn({
      "stroke-aps1": isHoveringOnAddNewItem
    })}
  />
  <span class="min-w-fit whitespace-nowrap">
    {addText}
  </span>
</button>
