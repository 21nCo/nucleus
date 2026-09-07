<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
  import { enumToString } from "@21n/shared-utils/text.utils";

  let {
    items = [],
    size = Size.md,
    bgSize = Size.md,
    parentBgIndex = 1,
    selected = $bindable(),
    onChange = undefined,
    onNone = undefined,
    class: classList = ""
  }: {
    items?: IToggleItem[];
    size?: Size.sm | Size.md | Size.lg;
    bgSize?: Size.sm | Size.md | Size.lg;
    parentBgIndex?: number;
    selected?: string | undefined;
    onChange?: ((event: CustomEvent<string>) => void) | undefined;
    onNone?: ((event: CustomEvent<string>) => void) | undefined;
    class?: string;
  } = $props();

  export function reset() {
    selected = undefined;
  }
</script>

<div class={cn("flex items-center justify-center w-full h-full", classList)}>
  {#each items as item}
    <Toggle
      icon={item.icon}
      {size}
      {bgSize}
      {parentBgIndex}
      count={item.count}
      on={selected === item.value}
      tooltip={item.tooltip ?? enumToString(item.value)}
      onChange={(event) => {
        if (event.detail === false) {
          onNone?.(new CustomEvent("none", { detail: item.value }));
          selected = undefined;
          return;
        }
        selected = item.value;
        onChange?.(new CustomEvent("change", { detail: item.value }));
      }}
    />
  {/each}
</div>
