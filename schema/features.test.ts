import { describe, expect, it } from "vitest";
import { Product } from "./product.type";
import { nucleumDatafnSchema } from "./datafn";
import {
  allFeatureIds,
  composeDefinition,
  resolveProductTableNames
} from "./features";

describe("DataFn feature composition", () => {
  it("builds the union schema from every feature", () => {
    const composed = composeDefinition(allFeatureIds);
    expect(composed.resources.map((resource) => resource.name)).toEqual(
      nucleumDatafnSchema.resources.map((resource) => resource.name)
    );
    expect(composed.relations).toHaveLength(nucleumDatafnSchema.relations.length);
  });

  it("derives product table sets from feature combinations", () => {
    expect(resolveProductTableNames(Product.MEMOTRON)).toEqual([
      "accessLog",
      "capture",
      "node",
      "vector",
      "collection",
      "linkTag",
      "property",
      "view",
      "file"
    ]);
    expect(resolveProductTableNames(Product.POINTRON)).toEqual([
      "accessLog",
      "objective",
      "session",
      "sessionLog",
      "task",
      "event",
      "collection",
      "linkTag",
      "property",
      "view"
    ]);
    expect(resolveProductTableNames(Product.NUCLEUM)).toEqual(
      nucleumDatafnSchema.resources.map((resource) => resource.name)
    );
  });

  it("drops relation endpoints that are outside the feature set", () => {
    const memotron = composeDefinition([
      "system",
      "memory",
      "collections",
      "files"
    ]);
    const collectionItems = memotron.relations.find(
      (relation) => relation.joinTable === "collection_items"
    );
    expect(collectionItems?.from).toEqual(["node"]);
    expect(
      memotron.resources.some((resource) => resource.name === "objective")
    ).toBe(false);
  });
});
