import type { DatafnSchemaLiteral } from "@datafn/core";

import { nucleumDatafnSchema } from "./datafn";

export type NucleumDatafnSearchResourceFields = Record<string, string[]>;

type NucleumDatafnSchemaResource = DatafnSchemaLiteral<
  typeof nucleumDatafnSchema
>["resources"][number];
type NucleumDatafnSearchField =
  NucleumDatafnSchemaResource extends infer Resource
    ? Resource extends {
        readonly indices: { readonly search: readonly (infer Field)[] };
      }
      ? Extract<Field, string>
      : never
    : never;

/** Default SearchFn query behavior used by DataFn client and server search. */
export const nucleumDatafnSearchDefaults = {
  prefix: true,
  fuzzy: 1,
  fieldBoosts: {
    label: 4,
    text: 1.5,
    notes: 1.25
  } satisfies Partial<Record<NucleumDatafnSearchField, number>>
} as const;

/** Text pipeline settings for local IndexedDB-backed SearchFn indexes. */
export const nucleumDatafnSearchPipeline = {
  enableStemming: true,
  enableEdgeNGrams: true,
  edgeNGramMinLength: 2,
  edgeNGramMaxLength: 20,
  edgeNGramFieldConfig: {
    label: { enabled: true, minLength: 1, maxLength: 30 }
  } satisfies Partial<
    Record<
      NucleumDatafnSearchField,
      { enabled: boolean; minLength: number; maxLength: number }
    >
  >
} as const;

/** Search indexing disclosure for local and server-side resource fields. */
export const nucleumDatafnSensitiveSearchReview = {
  localIndexedFields: resolveNucleumDatafnSearchResourceFields(),
  serverIndexedFields: {
    mode: "account-service-opensearch",
    externalProviderEgress: true,
    fields: resolveNucleumDatafnSearchResourceFields()
  }
} as const;

const nucleumDatafnSearchIndexSchemaVersion = "v2";

/** Resolves the app-owned SearchFn index version for persistent local indexes. */
export function resolveNucleumDatafnSearchIndexVersion(): string {
  return [
    "nucleum-datafn-search",
    nucleumDatafnSearchIndexSchemaVersion,
    stableSearchConfigHash({
      defaults: nucleumDatafnSearchDefaults,
      pipeline: nucleumDatafnSearchPipeline,
      fields: resolveNucleumDatafnSearchResourceFields()
    })
  ].join(":");
}

/** Resolves DataFn schema search indices into SearchFn resource field mappings. */
export function resolveNucleumDatafnSearchResourceFields(): NucleumDatafnSearchResourceFields {
  const fields: NucleumDatafnSearchResourceFields = {};
  for (const resource of nucleumDatafnSchema.resources) {
    const searchFields = Array.isArray(resource.indices)
      ? []
      : ((resource.indices && "search" in resource.indices
          ? resource.indices.search
          : []) ?? []);
    if (searchFields.length > 0) {
      fields[resource.name] = [...searchFields];
    }
  }
  return fields;
}

function stableSearchConfigHash(value: unknown): string {
  const raw = JSON.stringify(value);
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
