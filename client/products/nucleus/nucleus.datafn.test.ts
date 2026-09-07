import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  datafn,
  destroyNucleumDatafn,
  initializeNucleumDatafn,
  resolveDatafnBootResources
} from "@nucleum/datafn/datafn.store";
import { Product } from "@nucleum/client/config/product.type";
import { UserDataMode } from "@nucleum/client/runtime/account/account.type";
import { appStore } from "@nucleum/stores/app.store";
import { Resource } from "@nucleum/datafn/resource.enum";
import { NodeType } from "@nucleum/features/memory/node/node.type";
import { CollectionType } from "@nucleum/features/collections/collection.type";
import { resolveProductResources } from "@nucleum/datafn/resource.utils";
import { ObjectiveStatus, ObjectiveType } from "@nucleum/features/focus/goals/goal.type";

describe("Nucleum DataFn superset resources", () => {
  afterEach(async () => {
    await destroyNucleumDatafn();
  });

  async function boot(product: Product, env: string) {
    appStore.set({
      ...get(appStore),
      product
    });
    await initializeNucleumDatafn({
      product,
      account: {
        dataMode: UserDataMode.LOCAL,
        userId: "nucleus-resource-test"
      },
      dapId: "nucleus-dap",
      env
    });
  }

  it("browses and searches the Nucleum superset without leaking product-only records", async () => {
    const env = `test-${crypto.randomUUID()}`;
    await boot(Product.NUCLEUM, env);

    expect(resolveDatafnBootResources(Product.NUCLEUM)).toEqual(
      expect.arrayContaining([Resource.collection, Resource.event])
    );
    expect(resolveProductResources(Product.NUCLEUM, "search")).toEqual(
      expect.arrayContaining([
        Resource.node,
        Resource.objective,
        Resource.task,
        Resource.collection,
        Resource.event
      ])
    );
    expect(resolveProductResources(Product.NUCLEUM, "search")).not.toContain(
      Resource.relation
    );

    await datafn.node.mutate({
      operation: "insert",
      id: "node:nucleus-alpha",
      record: {
        id: "node:nucleus-alpha",
        label: "Nucleus alpha node",
        text: "Nucleus alpha memory",
        body: "",
        contentType: NodeType.NODULAR_MARKDOWN
      }
    });
    const goal = {
      id: "objective:nucleus-alpha",
      label: "Nucleus alpha objective",
      type: ObjectiveType.INDEFINITE,
      status: ObjectiveStatus.NOT_STARTED,
      isPinnedForQuickFocus: false
    };
    await datafn.objective.mutate({
      operation: "insert",
      id: goal.id,
      record: goal
    });
    expect(goal?.id).toBeTruthy();
    await datafn.task.mutate({
      operation: "insert",
      id: "task:nucleus-alpha",
      record: {
        id: "task:nucleus-alpha",
        label: "Nucleus alpha task",
        objectiveId: goal?.id,
        dateUnix: 0,
        isChecked: false
      }
    });
    await datafn.collection.mutate({
      operation: "insert",
      id: "collection:nucleus-alpha",
      record: {
        id: "collection:nucleus-alpha",
        label: "Nucleus alpha collection",
        type: CollectionType.TYPED,
        resource: Resource.node
      }
    });
    await datafn.event.mutate({
      operation: "insert",
      id: "event:nucleus-alpha",
      record: {
        id: "event:nucleus-alpha",
        label: "Nucleus alpha event",
        event: "Nucleus alpha event",
        startUnix: Date.now(),
        endUnix: Date.now() + 60 * 60 * 1000
      }
    });

    const searchResults = await datafn.search({
      query: "nucleus alpha",
      resources: resolveProductResources(Product.NUCLEUM, "search"),
      source: "local"
    });
    const searchIds = searchResults.results?.map((item: any) => item.data.id);
    expect(searchIds).toEqual(
      expect.arrayContaining([
        "node:nucleus-alpha",
        goal!.id,
        "task:nucleus-alpha",
        "collection:nucleus-alpha",
        "event:nucleus-alpha"
      ])
    );

    const eventResults = await datafn.search({
      query: "alpha event",
      resources: [Resource.event],
      fields: ["label", "event"],
      source: "local"
    });
    expect(eventResults.results?.map((item: any) => item.data.id)).toContain(
      "event:nucleus-alpha"
    );

    await destroyNucleumDatafn();
    await boot(Product.MEMOTRON, env);
    await datafn.task.mutate({
      operation: "insert",
      id: "task:memotron-hidden-task",
      record: {
        id: "task:memotron-hidden-task",
        label: "Memotron hidden task",
        dateUnix: 0,
        isChecked: false
      }
    });
    const memotronResults = await datafn.search({
      query: "hidden task",
      resources: resolveProductResources(Product.MEMOTRON, "search"),
      source: "local"
    });
    expect(
      memotronResults.results?.map((item: any) => item.data.id)
    ).not.toContain("task:memotron-hidden-task");

    await destroyNucleumDatafn();
    await boot(Product.POINTRON, env);
    await datafn.node.mutate({
      operation: "insert",
      id: "node:pointron-hidden-node",
      record: {
        id: "node:pointron-hidden-node",
        label: "Pointron hidden node",
        text: "Pointron hidden node",
        body: "",
        contentType: NodeType.NODULAR_MARKDOWN
      }
    });
    const pointronResults = await datafn.search({
      query: "hidden node",
      resources: resolveProductResources(Product.POINTRON, "search"),
      source: "local"
    });
    expect(
      pointronResults.results?.map((item: any) => item.data.id)
    ).not.toContain("node:pointron-hidden-node");
  });
});
