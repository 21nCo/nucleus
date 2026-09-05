import { describe, expect, it } from "vitest";

import {
  nucleumDatafnSearchDefaults,
  nucleumDatafnSearchPipeline,
  nucleumDatafnSensitiveSearchReview,
  resolveNucleumDatafnSearchResourceFields
} from "./search.provider";

const expectedSearchResourceFields = {
  capture: ["label"],
  collection: ["label"],
  space: ["label"],
  event: ["event", "label"],
  file: ["label"],
  objective: ["label"],
  linkTag: ["label"],
  node: ["label", "text", "notes"],
  property: ["label"],
  task: ["label"],
  view: ["label"]
};

describe("Nucleum DataFn search provider invariants", () => {
  it("keeps local and server disclosures aligned with every schema search field", () => {
    const resourceFields = resolveNucleumDatafnSearchResourceFields();

    expect(resourceFields).toEqual(expectedSearchResourceFields);
    expect(nucleumDatafnSensitiveSearchReview.localIndexedFields).toEqual(
      resourceFields
    );
    expect(
      nucleumDatafnSensitiveSearchReview.serverIndexedFields.fields
    ).toEqual(resourceFields);
  });

  it("configures search behavior only for fields indexed by the schema", () => {
    const searchableFields = new Set(
      Object.values(resolveNucleumDatafnSearchResourceFields()).flat()
    );
    const configuredFields = [
      ...Object.keys(nucleumDatafnSearchDefaults.fieldBoosts),
      ...Object.keys(nucleumDatafnSearchPipeline.edgeNGramFieldConfig)
    ];

    expect(
      configuredFields.filter((field) => !searchableFields.has(field))
    ).toEqual([]);
  });
});
