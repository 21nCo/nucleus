import { beforeEach, describe, expect, it, vi } from "vitest";
import { writable } from "svelte/store";
import { ModifierKey } from "@21n/elements/keyboard/keyboard.type";
import { OperatingSystem } from "@nucleum/client/runtime/context.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { configureShortcutHost } from "./shortcut-host";

const mocks = vi.hoisted(() => ({
  merge: vi.fn(),
  set: vi.fn(),
  dispose: vi.fn()
}));
vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: {
    kv: {
      signal: () => ({
        subscribe: (fn: (value: object) => void) => {
          fn({});
          return () => {};
        },
        dispose: mocks.dispose
      }),
      merge: mocks.merge,
      set: mocks.set
    }
  }
}));
vi.mock("@nucleum/stores/context.store", () => ({
  default: writable({ os: OperatingSystem.MACOS })
}));
vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: { log: vi.fn(), error: vi.fn() }
}));
import context from "@nucleum/stores/context.store";
import { keyboardShortcuts } from "./shortcuts.store";

const defaults = {
  library: { key: "l" },
  command: { key: "p", modifiers: [ModifierKey.META] }
};
beforeEach(() => {
  vi.clearAllMocks();
  context.update((value) => ({ ...value, os: OperatingSystem.MACOS }));
  configureShortcutHost({ defaults, configurableActions: () => ["library"] });
  keyboardShortcuts.loader({});
  mocks.set.mockClear();
});

describe("shared keyboard shortcuts", () => {
  it("matches application defaults and requires exact modifiers", () => {
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "P", metaKey: true }),
        "command"
      )
    ).toBe(true);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", {
          key: "p",
          metaKey: true,
          shiftKey: true
        }),
        "command"
      )
    ).toBe(false);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "p" }),
        "command"
      )
    ).toBe(false);
  });

  it("maps default Meta to Control on Windows without changing configured defaults", () => {
    context.update((value) => ({ ...value, os: OperatingSystem.WINDOWS }));
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "p", ctrlKey: true }),
        "command"
      )
    ).toBe(true);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "p", metaKey: true }),
        "command"
      )
    ).toBe(false);
    expect(defaults.command.modifiers).toEqual([ModifierKey.META]);
  });

  it("persists an override under the keyboard resource and applies it immediately", () => {
    const override = { key: "k", modifiers: [ModifierKey.ALT] };
    keyboardShortcuts.saveShortcut("library", override);
    expect(mocks.merge).toHaveBeenCalledWith(Resource.keyboardShortcuts, {
      library: override
    });
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "k", altKey: true }),
        "library"
      )
    ).toBe(true);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "l" }),
        "library"
      )
    ).toBe(false);
  });

  it("filters configurable actions using the current product configuration", () => {
    expect(
      keyboardShortcuts.fetchConfiguratbleShortcuts().map((x) => x.action)
    ).toEqual(["library"]);
    configureShortcutHost({ defaults, configurableActions: () => ["command"] });
    expect(
      keyboardShortcuts.fetchConfiguratbleShortcuts().map((x) => x.action)
    ).toEqual(["command"]);
    configureShortcutHost({ defaults, configurableActions: () => undefined });
    expect(keyboardShortcuts.fetchConfiguratbleShortcuts()).toEqual([]);
  });

  it("gives a physical code precedence over the key label", () => {
    const shortcut = { key: "z", code: "KeyY" };
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "y", code: "KeyY" }),
        shortcut
      )
    ).toBe(true);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "z", code: "KeyZ" }),
        shortcut
      )
    ).toBe(false);
  });

  it("matches literal shortcuts with exact modifiers", () => {
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "x" }),
        { key: "x" }
      )
    ).toBe(true);
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "x", altKey: true }),
        { key: "x" }
      )
    ).toBe(false);
  });

  it("returns no match for an unknown action or a missing event key", () => {
    expect(
      keyboardShortcuts.checkShortcut(
        new KeyboardEvent("keydown", { key: "x" }),
        "unknown"
      )
    ).toBe(false);
    expect(
      keyboardShortcuts.resolveShortcut(new KeyboardEvent("keydown"))
    ).toEqual({ shortcut: undefined, modifiers: [] });
  });

  it("loads stored overrides without modifying their values", () => {
    const saved = { library: { key: "j", modifiers: [ModifierKey.SHIFT] } };
    keyboardShortcuts.loader(saved);
    expect(mocks.set).toHaveBeenCalledWith(Resource.keyboardShortcuts, saved);
    expect(keyboardShortcuts.resolveShortcutForAction("library")).toEqual({
      action: "library",
      key: "j",
      code: undefined,
      modifiers: [ModifierKey.SHIFT]
    });
  });
});
