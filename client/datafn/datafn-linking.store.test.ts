import { afterEach, describe, expect, it, vi } from "vitest";
import { relateDatafnRecords } from "./datafn-linking.store";
import { datafnRuntime } from "@nucleum/datafn/datafn.store";
import type { NucleumDatafnRuntime } from "./datafn.store";

const moduleMocks = vi.hoisted(() => {
  let runtime: unknown = null;
  const subscribers = new Set<(value: unknown) => void>();
  return {
    mutate: vi.fn(),
    table: vi.fn(),
    transact: vi.fn(),
    runtimeStore: {
      subscribe(subscriber: (value: unknown) => void) {
        subscribers.add(subscriber);
        subscriber(runtime);
        return () => subscribers.delete(subscriber);
      },
      set(value: unknown) {
        runtime = value;
        subscribers.forEach((subscriber) => subscriber(value));
      }
    }
  };
});

vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: {
    mutate: moduleMocks.mutate,
    table: moduleMocks.table,
    transact: moduleMocks.transact
  },
  datafnRuntime: moduleMocks.runtimeStore
}));

describe("datafn-linking.store", () => {
  afterEach(() => {
    datafnRuntime.set(null);
    vi.clearAllMocks();
  });

  it("rolls back applied local relations when a later mutation fails", async () => {
    moduleMocks.table.mockReturnValue({
      relation: () => ({
        query: async () => ({ data: [] })
      })
    });
    const failure = new Error("second relation failed");
    moduleMocks.mutate
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce({ ok: true });
    datafnRuntime.set({
      mode: "local-only"
    } as NucleumDatafnRuntime);

    await expect(
      relateDatafnRecords({
        sourceIds: ["node:first", "node:second"],
        targetId: "collection:target"
      })
    ).rejects.toBe(failure);

    expect(
      moduleMocks.mutate.mock.calls.map(([mutation]) => mutation)
    ).toMatchObject([
      { operation: "relate", id: "node:first" },
      { operation: "relate", id: "node:second" },
      { operation: "unrelate", id: "node:first" }
    ]);
  });
});
