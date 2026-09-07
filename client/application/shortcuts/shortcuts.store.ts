import { Resource } from "@nucleum/datafn/resource.enum";
import { get, writable } from "svelte/store";
import type {
  IKeyboardShortcut,
  IKeyboardShortcutsStore
} from "@21n/types/shortcut.type";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { resolveModifiers } from "@nucleum/application/shortcuts/shortcut.utils";
import context from "@nucleum/stores/context.store";
import { OperatingSystem } from "@21n/types/context.type";
import { shortcutsConfig } from "@nucleum/application/shortcuts/shortcuts.config";
import { replacer } from "@21n/shared-utils/json.utils";
import { resolveProductConfig } from "@nucleum/products/product.config";
import { datafn } from "@nucleum/datafn/datafn.store";

const keyboardShortcutsSignal = datafn.kv.signal<IKeyboardShortcutsStore>(
  Resource.keyboardShortcuts,
  { defaultValue: {} }
);
const keyboardShortcutsLocal = writable<IKeyboardShortcutsStore>({});

keyboardShortcutsSignal.subscribe((value) => {
  keyboardShortcutsLocal.set(value ?? {});
});

export const keyboardShortcuts = {
  subscribe: keyboardShortcutsLocal.subscribe,
  get() {
    return get(keyboardShortcutsLocal);
  },
  saveShortcut(action: string, shortcut: IKeyboardShortcut) {
    return this.modify({ [action]: shortcut });
  },

  loader(data: IKeyboardShortcutsStore) {
    keyboardShortcutsLocal.set(data);
    return datafn.kv.set(Resource.keyboardShortcuts, data);
  },

  modify(n: Partial<IKeyboardShortcutsStore>) {
    keyboardShortcutsLocal.update(
      (current) => ({ ...current, ...n }) as IKeyboardShortcutsStore
    );
    return datafn.kv.merge(Resource.keyboardShortcuts, n);
  },

  fetchKeyMap(): (IKeyboardShortcut & { action: string })[] {
    let defaultKeyMap = shortcutsConfig;
    const ctx = get(context);
    if (ctx.os === OperatingSystem.WINDOWS) {
      defaultKeyMap = replacer(defaultKeyMap, { Meta: "Control" });
    }
    return Object.entries({ ...defaultKeyMap, ...this.get() })
      .map(([action, shortcut]) => ({
        action,
        key: shortcut?.key,
        code: shortcut?.code,
        modifiers: shortcut?.modifiers
      }))
      .filter((x: any) => x.key);
  },

  fetchConfiguratbleShortcuts() {
    const config = resolveProductConfig();
    const { configurableShortcuts } = config;
    return this.fetchKeyMap().filter((x) =>
      configurableShortcuts?.includes(x.action)
    );
  },

  resolveShortcutForAction(action: string) {
    const keyMap = this.fetchKeyMap();
    const shortcut = keyMap.find((s: any) => s.action === action);
    return shortcut;
  },

  /**
   * Resolves the shortcut for the given key and modifiers.
   * @param key
   * @param modifiers
   */
  resolveShortcut(event: KeyboardEvent) {
    if (!event?.key) return { shortcut: undefined, modifiers: [] };
    const modifiers = resolveModifiers(event);
    const keyMap = this.fetchKeyMap();
    const shortcut = keyMap.find((s: any) => {
      return this.checkShortcut(event, s);
    });
    logger.log({ event, modifiers, shortcut, keyMap });
    return { shortcut, modifiers };
  },

  checkShortcut(event: KeyboardEvent, shortcut: string | IKeyboardShortcut) {
    try {
      if (typeof shortcut === "string") {
        const keyMap = this.fetchKeyMap();
        const result = keyMap.find((s: any) => s.action === shortcut);
        if (!result) return false;
        shortcut = result;
      }
      const { key, code, modifiers } = shortcut;
      const eventKey = event.key;
      const eventCode = event.code;
      const eventModifiers = resolveModifiers(event);
      if (code && code.toLowerCase() !== eventCode.toLowerCase()) return false;
      else if (!code && key.toLowerCase() !== eventKey.toLowerCase())
        return false;
      if (modifiers && modifiers.length !== eventModifiers.length) return false;
      return (
        (modifiers &&
          modifiers.every((m: any) => eventModifiers.includes(m))) ||
        (!modifiers && eventModifiers.length === 0)
      );
    } catch (error) {
      logger.error({ error, shortcut, event });
      return false;
    }
  },

  destroy() {
    keyboardShortcutsSignal.dispose();
  }
};

export type KeyboardShortcutsStoreType = typeof keyboardShortcuts;
