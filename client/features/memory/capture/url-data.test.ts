import { beforeEach, describe, expect, it, vi } from "vitest";
import { retrieveUrlData } from "./url-data";

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  parse: vi.fn(),
  contentScript: false,
  extension: false
}));
vi.mock("@21n/utils/network.utils", () => ({ performApiCall: mocks.request }));
vi.mock("@21n/utils/browser.utils", () => ({
  isContentScript: () => mocks.contentScript,
  isExtensionEnvironment: () => mocks.extension
}));
vi.mock("@nucleum/extensions/clipper/clipper.utils", () => ({
  extractFullTabData: mocks.parse
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.extension = false;
  mocks.contentScript = false;
  mocks.parse.mockResolvedValue({ label: "Parsed page" });
});

describe("memory URL capture", () => {
  it("parses transported HTML with its original URL", async () => {
    const text =
      "<html><head><title>Page</title></head><body>Body</body></html>";
    mocks.request.mockResolvedValue({ ok: true, json: async () => ({ text }) });
    expect(await retrieveUrlData("https://example.com/page")).toEqual({
      text,
      parsedData: { label: "Parsed page" }
    });
    expect(mocks.request).toHaveBeenCalledWith("utils/n/run", "POST", {
      url: "https://example.com/page",
      action: "get-webpage"
    });
    expect(mocks.parse.mock.calls[0][0].title).toBe("Page");
    expect(mocks.parse.mock.calls[0][1]).toEqual({
      docText: text,
      url: "https://example.com/page"
    });
  });

  it("returns raw embed data without invoking capture parsing", async () => {
    const data = { html: "<p>Embed</p>" };
    mocks.request.mockResolvedValue({ ok: true, json: async () => data });
    expect(
      await retrieveUrlData("https://example.com/embed", {
        isReturnRawData: true
      })
    ).toBe(data);
    expect(mocks.parse).not.toHaveBeenCalled();
  });

  it("accepts the content-script relay's already decoded response", async () => {
    mocks.extension = true;
    mocks.contentScript = true;
    const data = { title: "Relayed page" };
    mocks.request.mockResolvedValue(data);
    expect(await retrieveUrlData("https://example.com")).toEqual({
      ...data,
      parsedData: null
    });
  });

  it("ignores unsuccessful or non-response values outside content scripts", async () => {
    mocks.request
      .mockResolvedValueOnce({ ok: false, json: vi.fn() })
      .mockResolvedValueOnce({ text: "wrong transport shape" });
    expect(await retrieveUrlData("https://example.com")).toBeUndefined();
    expect(await retrieveUrlData("https://example.com")).toBeUndefined();
    expect(mocks.parse).not.toHaveBeenCalled();
  });
});
