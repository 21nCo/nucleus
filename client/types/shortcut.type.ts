import { ModifierKey } from "@21n/types/keyboard.type";

export type IKeyboardShortcut = {
  key: string;
  code?: string;
  modifiers?: ModifierKey[];
};

export type IKeyboardShortcutsStore = {
  [key: string]: IKeyboardShortcut;
};
