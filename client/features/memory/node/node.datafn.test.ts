import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  datafn,
  destroyNucleumDatafn,
  initializeNucleumDatafn
} from "@nucleum/datafn/datafn.store";
import { Product } from "@21n/types/product.type";
import { UserDataMode } from "@21n/types/account.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { appStore } from "@nucleum/stores/app.store";
import { NodeType } from "./node.type";
import { CaptureMethod } from "@nucleum/features/memory/capture/capture.type";

describe("Memotron DataFn resources", () => {
  afterEach(async () => {
    await destroyNucleumDatafn();
  });

  async function boot(env: string) {
    appStore.set({
      ...get(appStore),
      product: Product.MEMOTRON
    });
    await initializeNucleumDatafn({
      product: Product.MEMOTRON,
      account: {
        dataMode: UserDataMode.LOCAL,
        userId: "memotron-resource-test"
      },
      dapId: "memotron-dap",
      env
    });
  }

  it("persists node trees, capture drafts, and Memotron search data through DataFn", async () => {
    const env = `test-${crypto.randomUUID()}`;
    await boot(env);

    const rootId = "node:root-alpha";
    const childId = "node:block-alpha";
    await datafn.node.mutate([
      {
        operation: "insert",
        id: rootId,
        record: {
          id: rootId,
          label: "Alpha notebook",
          body: "",
          text: "Alpha offline notebook",
          contentType: NodeType.NODULAR_MARKDOWN
        }
      },
      {
        operation: "insert",
        id: childId,
        record: {
          id: childId,
          label: "",
          body: "Nested alpha block",
          text: "Nested alpha block",
          contentType: NodeType.SIMPLE_TEXT,
          parent: rootId,
          parentPath: rootId,
          creationContext: rootId,
          mdParent: [rootId]
        }
      }
    ]);
    await datafn.node.mutate({
      operation: "merge",
      id: rootId,
      record: {
        id: rootId,
        mdChildOrder: [childId]
      }
    });

    await datafn.capture.mutate({
      operation: "insert",
      id: "capture:alpha",
      record: {
        id: "capture:alpha",
        label: "Alpha capture",
        method: CaptureMethod.MARKDOWN,
        body: {
          blocks: []
        },
        childrenWithStructure: [],
        rootStructure: [],
        refreshId: 1
      }
    });

    const fetched = await datafn.node.query({
      select: ["*", "mdChildOrder"],
      filters: {
        id: rootId
      },
      limit: 1
    });
    expect(fetched.data?.[0]?.mdChildOrder?.[0]).toBe(childId);

    const rootsResult = await datafn.node.query({
      filters: {
        metaType: { $is_empty: true },
        parent: { $is_empty: true },
        creationContext: { $is_empty: true }
      }
    });
    const roots = rootsResult.data ?? [];
    expect(roots.map((item) => item.id)).toContain(rootId);
    expect(roots.map((item) => item.id)).not.toContain(childId);

    const searchResults = await datafn.search({
      query: "offline",
      resources: [Resource.node],
      fields: ["label", "text"],
      source: "local"
    });
    expect(searchResults.results?.map((item: any) => item.data.id)).toContain(
      rootId
    );

    const countResult = await datafn.node.query({
      select: ["id"],
      filters: {
        contentType: { $in: [NodeType.NODULAR_MARKDOWN] },
        metaType: { $is_empty: true },
        parent: { $is_empty: true },
        creationContext: { $is_empty: true }
      }
    });
    expect(countResult.data?.length).toBe(1);

    const subtypeCountResult = await datafn.node.query({
      filters: {
        metaType: { $is_empty: true }
      },
      groupBy: ["contentType"],
      aggregations: { total: { op: "count", field: "*" } }
    });
    const subtypeCounts = new Map(
      (subtypeCountResult.groups ?? []).map((group: any) => [
        group.contentType,
        group.total
      ])
    );
    expect(subtypeCounts?.get(NodeType.NODULAR_MARKDOWN)).toBe(1);

    const captureResult = await datafn.capture.query({
      filters: {
        id: "capture:alpha"
      },
      limit: 1
    });
    expect(captureResult.data?.[0]).toMatchObject({
      label: "Alpha capture",
      method: CaptureMethod.MARKDOWN
    });

    await destroyNucleumDatafn();
    await boot(env);

    const persistedNodeResult = await datafn.node.query({
      filters: {
        id: rootId
      },
      limit: 1
    });
    expect(persistedNodeResult.data?.[0]).toMatchObject({
      label: "Alpha notebook",
      text: "Alpha offline notebook"
    });
    const persistedCaptureResult = await datafn.capture.query({
      filters: {
        id: "capture:alpha"
      },
      limit: 1
    });
    expect(persistedCaptureResult.data?.[0]).toMatchObject({
      label: "Alpha capture"
    });
  });
});
