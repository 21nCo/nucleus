<script lang="ts">
  import { Size } from "@21n/elements/size.enum";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";
  import type { IKeyboardShortcut } from "@21n/elements/keyboard/shortcut.type";
  import { fade } from "svelte/transition";

    let {
    tooltip,
    shortcut = undefined,
    size = Size.md,
    parentBgIndex = 1,
  }: {
    tooltip: string;
    shortcut?: string | IKeyboardShortcut | undefined;
    size?: Size.sm | Size.md;
    parentBgIndex?: number;
  } = $props();

  
  
  
</script>

<div
  class="flex items-center gap-2 px-3 py-1.5 text-b3 bg-fgs2 text-bgs1"
  in:fade={{ duration: 300 }}
>
  <div class="whitespace-nowrap">
    {tooltip}
  </div>
  {#if shortcut}
    <div class="border border-brs3 rounded-md">
      <ShortcutText {shortcut} {size} {parentBgIndex} isPlainText={true} />
    </div>
  {/if}
</div>
