import { ModifierKey } from "@21n/elements/keyboard/keyboard.type";
import { OperatingSystem } from "@nucleum/client/runtime/context.type";
import { logger } from "@nucleum/client/runtime/logging/logger";

export function resolveShortcutText(params: {
  key: string;
  os: OperatingSystem;
  modifiers?: ModifierKey[];
}) {
  const { key, modifiers, os } = params;
  let modifierLabels: string[] = [];
  logger.log({ key, modifiers, os });
  if (modifiers && modifiers.length > 0) {
    modifierLabels = modifiers.map((x) => {
      if (x === ModifierKey.META) {
        if (os === OperatingSystem.MACOS || os === OperatingSystem.IOS) {
          return "⌘";
        } else {
          return "Win";
        }
      } else if (x === ModifierKey.CTRL) {
        return "Ctrl";
      } else return x;
    });
  }
  if (modifierLabels.length === 0) return key.toUpperCase();
  return modifierLabels.join(" + ") + (key ? " + " + key.toUpperCase() : "");
}

export function resolveModifiers(event: KeyboardEvent) {
  let modifiers: ModifierKey[] = [];
  if (event.metaKey) {
    modifiers.push(ModifierKey.META);
  }
  if (event.ctrlKey) {
    modifiers.push(ModifierKey.CTRL);
  }
  if (event.altKey) {
    modifiers.push(ModifierKey.ALT);
  }
  if (event.shiftKey) {
    modifiers.push(ModifierKey.SHIFT);
  }
  return modifiers;
}
