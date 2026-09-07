import { type ModifierKey } from "@21n/elements/keyboard/keyboard.type";

export type IKeyboardShortcut = {
  key: string;
  code?: string;
  modifiers?: ModifierKey[];
};

export type IKeyboardShortcutsStore = {
  [key: string]: IKeyboardShortcut;
};
