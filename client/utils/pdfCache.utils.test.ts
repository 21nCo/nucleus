import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerModule = vi.hoisted(() => ({
  logger: {
    warn: vi.fn(),
    log: vi.fn(),
    info: vi.fn(),
    error: vi.fn()
  }
}));

vi.mock("@nucleum/components/debug/logger.client", () => loggerModule);

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

describe("client/utils/pdfCache.utils", () => {
  let store: Map<string, Response>;
  let cachesMock: any;
  let pdfCache: any;
  let now = 0;
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    store = new Map();

    const cacheImpl = {
      match: vi.fn(async (request: Request) => {
        const response = store.get(request.url);
        return response ? response.clone() : null;
      }),
      put: vi.fn(async (request: Request, response: Response) => {
        store.set(request.url, response.clone());
      }),
      delete: vi.fn(async (request: Request) => {
        store.delete(request.url);
      }),
      keys: vi.fn(async () =>
        Array.from(store.keys()).map((url) => new Request(url, { method: "GET" }))
      )
    };

    cachesMock = {
      open: vi.fn(async () => cacheImpl),
      delete: vi.fn(async () => {
        store.clear();
      })
    };

    (globalThis as any).caches = cachesMock;

    now = 0;
    dateSpy = vi.spyOn(Date, "now").mockImplementation(() => now);

    ({ pdfCache } = await import("./pdfCache.utils"));
  });

  afterEach(() => {
    dateSpy.mockRestore();
    delete (globalThis as any).caches;
  });

  it("caches and retrieves pdf data", async () => {
    const data = new Uint8Array([1, 2, 3]);
    await pdfCache.set("https://example.com/sample.pdf", data);

    const result = await pdfCache.get("https://example.com/sample.pdf");

    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result!)).toEqual([1, 2, 3]);
  });

  it("expires cached entries past retention", async () => {
    const url = "https://example.com/old.pdf";
    await pdfCache.set(url, new Uint8Array([4]));

    now = WEEK_MS + 1;

    const result = await pdfCache.get(url);

    expect(result).toBeNull();
    expect(store.size).toBe(0);
  });

  it("returns cache statistics", async () => {
    await pdfCache.set("https://example.com/a.pdf", new Uint8Array([1]));
    await pdfCache.set("https://example.com/b.pdf", new Uint8Array([1, 2]));

    const stats = await pdfCache.getStats();

    expect(stats.count).toBe(2);
    expect(stats.totalSize).toBe(3);
    expect(typeof stats.oldestEntry === "number" || stats.oldestEntry === null).toBe(true);
  });

  it("clears cache via Cache API", async () => {
    await pdfCache.clear();
    expect(cachesMock.delete).toHaveBeenCalled();
  });
});
