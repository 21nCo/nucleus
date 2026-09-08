import type { IKeyboardShortcutsStore } from "@21n/elements/keyboard/shortcut.type";

/** Product-specific configuration supplied by the composing application shell. */
export interface ShortcutHost {
  defaults: IKeyboardShortcutsStore;
  configurableActions(): string[] | undefined;
}

let host: ShortcutHost | undefined;

/** Installs application shortcut configuration before keyboard interactions run. */
export function configureShortcutHost(value: ShortcutHost) {
  host = value;
}

/** Requires explicit application defaults instead of silently ignoring shortcuts. */
export function requireShortcutHost(): ShortcutHost {
  if (!host) throw new Error("Shortcut host has not been configured");
  return host;
}
