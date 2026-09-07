<svelte:options runes={true} />

<script lang="ts">
  import { isTextElement } from "@21n/utils/browser.utils";
  import type { IKeyboardShortcut } from "@nucleum/components/shortcuts/shortcut.type";
  import { keyboardShortcuts } from "@nucleum/components/shortcuts/shortcuts.store";
  let {
    isAllowFromTextInput = false,
    shortcuts
  }: {
    isAllowFromTextInput?: boolean;
    shortcuts: {
    shortcut: string | IKeyboardShortcut;
    callback: () => void;
  }[];
  } = $props();

  function shortcutListener(event: KeyboardEvent) {
    const isTextInputSource = isTextElement(event.target);
    if (isTextInputSource && !isAllowFromTextInput) return;
    const result = shortcuts.find((s) =>
      keyboardShortcuts.checkShortcut(event, s.shortcut)
    );
    if (result) {
      result.callback();
      event.preventDefault();
      event.stopPropagation();
    }
  }
</script>

<svelte:document onkeydown={shortcutListener} />
