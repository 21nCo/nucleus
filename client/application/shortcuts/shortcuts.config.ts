import { KeyboardKey, ModifierKey } from "@21n/elements/keyboard/keyboard.type";
import type { IKeyboardShortcut } from "@21n/elements/keyboard/shortcut.type";
import { Action } from "@nucleum/client/config/action.enum";
import { PointronAction } from "@nucleum/features/focus/pointronAction.enum";
import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";

export const shortcutsConfig: Record<string, IKeyboardShortcut> = {
  [Action.CALENDAR]: {
    key: "c"
  },
  [Action.LIBRARY]: {
    key: "l"
  },
  [PointronAction.FOCUS]: {
    key: "f"
  },
  focusModal: {
    key: "f",
    modifiers: [ModifierKey.SHIFT]
  },
  [Action.OVERVIEW]: {
    key: "o"
  },
  create: {
    key: "n"
  },
  node_create: {
    key: "p"
  },
  [Action.TOGGLE_SIDEBAR]: {
    key: "q"
  },
  [Action.CMD]: {
    key: "p",
    modifiers: [ModifierKey.META, ModifierKey.SHIFT]
  },
  [Action.EDIT_MODE]: {
    key: "e",
    modifiers: [ModifierKey.META]
  },
  [GlobalEvent.ACTIVATE_SEARCH_BOX]: {
    key: KeyboardKey.SPACE,
    code: KeyboardKey.SPACE
  },
  [MemotronAction.ACTIVATE_LINK_BOX]: {
    key: "l",
    modifiers: [ModifierKey.META]
  },
  [PointronAction.TOGGLE_FOCUS_SESSION]: {
    key: KeyboardKey.SPACE,
    code: KeyboardKey.SPACE,
    modifiers: [ModifierKey.META, ModifierKey.ALT]
  },
  [Action.SEARCH]: {
    key: "k",
    modifiers: [ModifierKey.META]
  },
  [Action.GO_BACK]: {
    key: "b",
    modifiers: [ModifierKey.META, ModifierKey.SHIFT]
  },
  [Action.GO_FORWARD]: {
    key: "f",
    modifiers: [ModifierKey.META, ModifierKey.SHIFT]
  },
  [Action.CLOSE]: {
    key: KeyboardKey.ESCAPE,
    code: KeyboardKey.ESCAPE,
    modifiers: [ModifierKey.META]
  },
  [GlobalEvent.ENTER]: {
    key: KeyboardKey.ENTER,
    modifiers: [ModifierKey.META]
  }
};
