<script lang="ts">
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Badge from "@21n/elements/text/Badge.svelte";

  type FontOption = {
    label: string;
    value: string;
    badge?: string;
  };

  let {
    fontOptions = [],
    selectedValue,
    size = Size.sm,
    onSelect
  }: {
    fontOptions?: FontOption[];
    selectedValue: string;
    size?: Size.md | Size.sm;
    onSelect: (value: string) => void;
  } = $props();

  function handleSelect(value: string) {
    if (onSelect) {
      onSelect(value);
    }
  }
</script>

<div class="w-full max-h-60 overflow-y-auto bg-bgs1">
  {#each fontOptions as font}
    <button
      class={cn(
        "w-full text-left px-3 py-2 flex justify-between items-center",
        {
          "bg-bgs2": font.value === selectedValue,
          "hover:bg-bgs2": font.value !== selectedValue,
          "text-b2": size === Size.sm,
          "font-[401]": font.value === "Space Grotesk"
        }
      )}
      style="font-family: '{font.value}'"
      onclick={() => handleSelect(font.value)}
      role="option"
      aria-selected={font.value === selectedValue}
    >
      <span>{font.label}</span>
      {#if font.badge}
        <Badge text={font.badge} />
      {/if}
    </button>
  {/each}
</div>
