<script lang="ts">
  import type { KeyboardShortcut } from "@nucleum/stores/preferences/user-preferences.type";
  let { onCollapse = undefined }: { onCollapse?: (() => void) | undefined } =
    $props();
  let defaultKeyMap: KeyboardShortcut[] = [
    // {
    //   key: "j",
    //   modifiers: ["ctrl"],
    //   action: "save"
    // },
    {
      key: "m",
      modifiers: ["ctrl"],
      action: "collapse"
    }
  ];
  const shortcutListener = (event: KeyboardEvent) => {
    let modifiers = [];
    if (event.metaKey || event.ctrlKey) {
      modifiers.push("ctrl");
    }
    if (event.altKey) {
      modifiers.push("alt");
    }
    if (event.shiftKey) {
      modifiers.push("shift");
    }
    const isShortcutFound = runShortcut(event.key, modifiers);
    event.stopPropagation();
    if (isShortcutFound) event.preventDefault();
  };

  function runShortcut(key: string, modifiers: string[]) {
    if (!defaultKeyMap) return;
    let keyMap = defaultKeyMap;
    let userKeyMap = [];
    if (userKeyMap) {
      keyMap = defaultKeyMap.filter(
        (x: KeyboardShortcut) =>
          !userKeyMap?.some((y: KeyboardShortcut) => y.action === x.action)
      );
      keyMap = [...keyMap, ...userKeyMap];
    }
    const shortcut = keyMap.find((s: any) => {
      if (s.key !== key) return false;
      if (s.modifiers.length !== modifiers.length) return false;
      return s.modifiers.every((m: any) => modifiers.includes(m.toLowerCase()));
    });
    if (!shortcut) return;
    if (shortcut.action === "collapse") {
      onCollapse?.();
    }
    return true;
  }
</script>

<svelte:window onkeydown={shortcutListener} />
