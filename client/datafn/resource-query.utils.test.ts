import { describe, expect, it, vi } from "vitest";
import { Resource } from "@nucleum/datafn/resource.enum";
import { resolveResource } from "./resource-query.utils";

const query = vi.hoisted(() => vi.fn());
vi.mock("@nucleum/datafn/datafn.store", () => ({
  datafn: { table: vi.fn(() => ({ query })) }
}));

describe("resource lookup", () => {
  it("includes inactive events and preserves legacy event projections", async () => {
    query.mockResolvedValueOnce({
      data: [
        {
          id: `${Resource.event}:one`,
          event: "Meeting",
          value: { startUnix: 10, endUnix: 20 }
        }
      ]
    });
    const result = await resolveResource(`${Resource.event}:one`);
    expect(query).toHaveBeenLastCalledWith({
      filters: { id: `${Resource.event}:one` },
      limit: 1,
      metadata: { includeTrashed: true, includeArchived: true }
    });
    expect(result).toMatchObject({
      event: "Meeting",
      label: "Meeting",
      startUnix: 10,
      endUnix: 20
    });
  });

  it("does not synthesize an absent resource", async () => {
    query.mockResolvedValueOnce({ data: [] });
    expect(await resolveResource(`${Resource.node}:missing`)).toBeUndefined();
  });

  it("preserves non-event records", async () => {
    const record = {
      id: `${Resource.node}:one`,
      label: "Note",
      body: "Content"
    };
    query.mockResolvedValueOnce({ data: [record] });
    expect(await resolveResource(`${Resource.node}:one`)).toBe(record);
  });
});
