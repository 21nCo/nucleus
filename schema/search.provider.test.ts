import { describe, expect, it } from "vitest";

import {
  nucleumDatafnSearchDefaults,
  nucleumDatafnSearchPipeline,
  resolveNucleumDatafnSearchIndexVersion,
  resolveNucleumDatafnSearchResourceFields
} from "./search.provider";

describe("Nucleum DataFn search provider", () => {
  it("uses the forced v2 index namespace and includes the searchable resource fields", () => {
    const version = resolveNucleumDatafnSearchIndexVersion();

    expect(version).toMatch(/^nucleum-datafn-search:v2:[a-z0-9]+$/);
    expect(resolveNucleumDatafnSearchResourceFields()).toMatchObject({
      collection: ["label"],
      file: ["label"],
      node: ["label", "text", "notes"],
      objective: ["label"],
      task: ["label"]
    });
  });

  it("keeps prefix edge-ngrams enabled while giving exact labels the strongest field boost", () => {
    expect(nucleumDatafnSearchDefaults).toMatchObject({
      prefix: true,
      fuzzy: 1,
      fieldBoosts: {
        label: 4,
        text: 1.5,
        notes: 1.25
      }
    });
    expect(nucleumDatafnSearchPipeline).toMatchObject({
      enableEdgeNGrams: true,
      edgeNGramFieldConfig: {
        label: { enabled: true, minLength: 1, maxLength: 30 }
      }
    });
  });
});
