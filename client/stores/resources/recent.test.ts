import { beforeEach, describe, expect, it, vi } from "vitest";
import { Resource } from "@nucleum/datafn/resource.enum";
import { configureRecentsHost } from "./recent-host";
import { RecentsStore } from "./recent.store";

const mocks = vi.hoisted(() => ({ table: vi.fn(), error: vi.fn() }));
vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: { table: mocks.table }
}));
vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: { log: vi.fn(), error: mocks.error }
}));

beforeEach(() => {
  vi.clearAllMocks();
  configureRecentsHost({ resources: () => [Resource.task] });
});

describe("shared recent records", () => {
  it("queries bounded active records and normalizes valid timestamps", async () => {
    const records = [
      { id: "task:old", updatedAt: "2026-01-01T00:00:00Z" },
      { id: "task:new", updatedAt: new Date("2026-02-01T00:00:00Z") },
      { id: "task:invalid", updatedAt: "invalid" }
    ];
    const query = vi.fn().mockResolvedValue({ data: records });
    mocks.table.mockReturnValue({ query });
    const store = new RecentsStore();
    expect(store.get().isInitialized).toBe(false);
    await store.refresh([Resource.task]);
    expect(query).toHaveBeenCalledWith({
      sort: ["-updatedAt"],
      limit: 20,
      metadata: { includeTrashed: false, includeArchived: false }
    });
    expect(store.get().isInitialized).toBe(true);
    expect(store.resolve().map((record) => record.id)).toEqual([
      "task:new",
      "task:old"
    ]);
  });

  it("reads the current product resources on each everything refresh", async () => {
    let resources = [Resource.task];
    configureRecentsHost({ resources: () => resources });
    const query = vi.fn().mockResolvedValue({ data: [] });
    mocks.table.mockReturnValue({ query });
    const store = new RecentsStore();
    await store.refresh([Resource.everything]);
    expect(mocks.table.mock.calls.map(([resource]) => resource)).toEqual([
      Resource.task
    ]);
    resources = [Resource.node, Resource.collection];
    mocks.table.mockClear();
    await store.refresh([Resource.everything]);
    expect(mocks.table.mock.calls.map(([resource]) => resource)).toEqual(
      resources
    );
  });

  it("finishes empty when the product provides no resource list", async () => {
    configureRecentsHost({ resources: () => undefined });
    const store = new RecentsStore();
    await store.refresh([Resource.everything]);
    expect(mocks.table).not.toHaveBeenCalled();
    expect(store.get()).toEqual({ recents: [], isInitialized: true });
  });

  it("retains successful resource results after another resource fails", async () => {
    mocks.table.mockImplementation((resource) => ({
      query:
        resource === Resource.node
          ? vi.fn().mockRejectedValue(new Error("query failed"))
          : vi
              .fn()
              .mockResolvedValue({
                data: [{ id: "task:one", updatedAt: 1000 }]
              })
    }));
    const store = new RecentsStore();
    await store.refresh([Resource.node, Resource.task]);
    expect(mocks.error).toHaveBeenCalledOnce();
    expect(store.resolve().map((record) => record.id)).toEqual(["task:one"]);
    expect(store.get().isInitialized).toBe(true);
  });

  it("replaces a recent record with the same normalized identity", () => {
    const store = new RecentsStore();
    store.add(
      { id: "task:one", label: "before" },
      { type: Resource.task, timestamp: new Date(1000) }
    );
    store.add(
      { id: "task:one", label: "after" },
      { type: Resource.task, timestamp: new Date(2000) }
    );
    store.add(
      { id: "task:invalid" },
      { type: Resource.task, timestamp: new Date(NaN) }
    );
    expect(store.resolve()).toEqual([{ id: "task:one", label: "after" }]);
  });

  it("filters typed exclusions and sorts mixed recents by timestamp", () => {
    const store = new RecentsStore();
    store.add(
      { id: "task:one" },
      { type: Resource.task, timestamp: new Date(1000) }
    );
    store.add(
      { id: "node:one" },
      { type: Resource.node, timestamp: new Date(3000) }
    );
    store.add(
      { id: "task:two" },
      { type: Resource.task, timestamp: new Date(2000) }
    );
    expect(
      store.resolve({ type: Resource.task, exclude: ["task:one"] })
    ).toEqual([{ id: "task:two" }]);
    expect(store.resolve().map((record) => record.id)).toEqual([
      "node:one",
      "task:two",
      "task:one"
    ]);
  });
});
