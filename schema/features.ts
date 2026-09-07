import { defineSchema } from "@datafn/core";
import { Product } from "./product.type";
import {
  arrayField,
  booleanField,
  commonShareFields,
  dateField,
  idField,
  jsonField,
  labelField,
  numberField,
  objectField,
  shareableCapabilities,
  stringField,
  systemCapabilities
} from "./fields";

type DatafnSchemaInput = Parameters<typeof defineSchema>[0];
type DatafnResourceDefinition = DatafnSchemaInput["resources"][number];
type DatafnRelationDefinition = NonNullable<
  DatafnSchemaInput["relations"]
>[number];
type DatafnRelationEndpoint = DatafnRelationDefinition["from"];

export type FeatureDefinition = {
  resources: readonly DatafnResourceDefinition[];
  relations: readonly DatafnRelationDefinition[];
};

const accessLog = {
  name: "accessLog",
  version: 1,
  idPrefix: "accessLog",
  isRemoteOnly: true,
  capabilities: systemCapabilities,
  fields: [
    idField,
    stringField("resourceId"),
    stringField("resource"),
    stringField("action"),
    dateField("timestamp"),
    stringField("event"),
    jsonField("value")
  ],
  indices: { base: ["resourceId", "resource", "action", "event"] }
} as const satisfies DatafnResourceDefinition;

const capture = {
  name: "capture",
  version: 1,
  idPrefix: "capture",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("method", true, false, "MARKDOWN"),
    objectField("avatar"),
    jsonField("body"),
    stringField("file"),
    arrayField("childrenWithStructure", true, []),
    arrayField("rootStructure", true, []),
    arrayField("links"),
    arrayField("propertyConfig"),
    arrayField("propertyValues"),
    numberField("refreshId", true, false, 0),
    stringField("nodeId"),
    jsonField("clipboard")
  ],
  indices: { base: ["method"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const collection = {
  name: "collection",
  version: 1,
  idPrefix: "collection",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("type", true),
    stringField("resource", true),
    stringField("typeToExtend", false, true),
    stringField("cover"),
    objectField("coverLayout"),
    stringField("description"),
    booleanField("isStarred", false, false),
    booleanField("isCaptureShortcutEnabled", false, false),
    stringField("query"),
    objectField("avatar"),
    stringField("importId")
  ],
  indices: {
    base: ["type", "resource", "typeToExtend"],
    search: ["label"]
  }
} as const satisfies DatafnResourceDefinition;

const space = {
  name: "space",
  version: 1,
  idPrefix: "space",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("type", true),
    stringField("description"),
    objectField("avatar"),
    booleanField("isStarred", false, false),
    arrayField("items", true, [])
  ],
  indices: { base: ["type"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const event = {
  name: "event",
  version: 1,
  idPrefix: "event",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("event", true),
    numberField("startUnix"),
    numberField("endUnix"),
    jsonField("value")
  ],
  indices: {
    base: ["event", "startUnix", "endUnix"],
    search: ["event", "label"]
  }
} as const satisfies DatafnResourceDefinition;

const file = {
  name: "file",
  version: 1,
  idPrefix: "file",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("type", true),
    numberField("size", true),
    numberField("duration"),
    stringField("name"),
    stringField("url"),
    stringField("thumbnailUrl"),
    jsonField("data"),
    jsonField("thumbnailData"),
    booleanField("isMeta", false, false),
    jsonField("metadata")
  ],
  indices: { base: ["type"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const objective = {
  name: "objective",
  version: 1,
  idPrefix: "objective",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    {
      ...stringField("type", true),
      enum: ["INDEFINITE", "DEFINITE", "ROUTINE"] as const
    },
    jsonField("description"),
    dateField("startDate"),
    dateField("endDate"),
    stringField("spanScale"),
    stringField("subObjectivesLayout"),
    {
      ...stringField("status", true),
      enum: ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const
    },
    numberField("color"),
    booleanField("isPinnedForQuickFocus", false, false),
    arrayField("tabsOrder"),
    objectField("uiState"),
    stringField("parentId", false, true),
    stringField("parentPath"),
    numberField("sortOrder"),
    ...commonShareFields
  ],
  indices: {
    base: ["type", "status", "parentId", "parentPath"],
    search: ["label"]
  }
} as const satisfies DatafnResourceDefinition;

const linkTag = {
  name: "linkTag",
  version: 1,
  idPrefix: "linkTag",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("group"),
    numberField("color"),
    objectField("avatar")
  ],
  indices: { search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const node = {
  name: "node",
  version: 1,
  idPrefix: "node",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    jsonField("body"),
    stringField("contentType", true),
    jsonField("metadata"),
    stringField("parent"),
    stringField("parentPath"),
    arrayField("mdChildOrder"),
    arrayField("mdParent"),
    numberField("sortOrder"),
    stringField("creationContext"),
    stringField("notes"),
    stringField("url"),
    stringField("file"),
    stringField("previewImage"),
    stringField("cover"),
    arrayField("avatar"),
    stringField("mdText"),
    stringField("text"),
    stringField("bodySearch"),
    stringField("labelSearch"),
    jsonField("config"),
    stringField("metaType"),
    dateField("date"),
    ...commonShareFields
  ],
  indices: {
    base: ["contentType", "metaType", "parent"],
    search: ["label", "text", "notes"]
  }
} as const satisfies DatafnResourceDefinition;

const property = {
  name: "property",
  version: 1,
  idPrefix: "property",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("type"),
    stringField("resource"),
    stringField("propertyType"),
    jsonField("config"),
    arrayField("options"),
    booleanField("isRequired", false, false),
    booleanField("isMulti", false, false),
    booleanField("isShowOnNodePage", false, false),
    booleanField("isShowOnCapture", false, false),
    numberField("order"),
    jsonField("defaultValue"),
    objectField("avatar"),
    stringField("description"),
    stringField("importId")
  ],
  indices: { base: ["type", "resource", "propertyType"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const session = {
  name: "session",
  version: 1,
  idPrefix: "session",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    {
      ...stringField("type", true),
      enum: [
        "PREDEFINED_INTERVALS",
        "COUNTDOWN",
        "COUNTUP",
        "MANUAL_ENTRY"
      ] as const
    },
    arrayField("blocks", true),
    numberField("elapsed", true),
    numberField("extended", true),
    stringField("start"),
    numberField("startUnix", true),
    stringField("end"),
    numberField("endUnix", true),
    stringField("plannedEnd"),
    numberField("plannedEndUnix"),
    stringField("manualEntryId", false, true),
    jsonField("notes")
  ],
  indices: { base: ["startUnix", "type"] }
} as const satisfies DatafnResourceDefinition;

const sessionLog = {
  name: "sessionLog",
  version: 1,
  idPrefix: "sessionLog",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    stringField("start"),
    numberField("startUnix", true),
    stringField("end"),
    numberField("endUnix", true),
    stringField("sessionId", true),
    stringField("taskName"),
    numberField("focus"),
    numberField("breakTime"),
    stringField("objectiveId", false, true),
    stringField("taskId", false, true),
    stringField("manualEntryId", false, true),
    numberField("tzOffset"),
    arrayField("targets")
  ],
  indices: { base: ["startUnix", "objectiveId", "sessionId", "taskId"] }
} as const satisfies DatafnResourceDefinition;

const task = {
  name: "task",
  version: 1,
  idPrefix: "task",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    booleanField("isChecked", false, false),
    numberField("estimated"),
    dateField("date"),
    numberField("dateUnix", true),
    numberField("minutes"),
    dateField("completedAt"),
    numberField("completedAtUnix", false, true),
    stringField("objectiveId", false, true),
    booleanField("isAncestorInactive", false, false)
  ],
  indices: { base: ["dateUnix", "objectiveId"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

const vector = {
  name: "vector",
  version: 1,
  idPrefix: "vector",
  isRemoteOnly: true,
  capabilities: systemCapabilities,
  defaultPermissions: false,
  fields: [
    idField,
    stringField("resourceId", true),
    stringField("resource", true),
    arrayField("embedding", true),
    jsonField("metadata")
  ],
  indices: { base: ["resourceId", "resource"], vector: ["embedding"] }
} as const satisfies DatafnResourceDefinition;

const view = {
  name: "view",
  version: 1,
  idPrefix: "view",
  capabilities: shareableCapabilities,
  fields: [
    idField,
    labelField,
    stringField("layout", true),
    stringField("tabBy"),
    stringField("groupBy"),
    stringField("subGroupBy"),
    arrayField("tabs"),
    arrayField("properties"),
    stringField("arrangement"),
    booleanField("isHideThumbnailPreview", false, false),
    booleanField("isHideThumbnailTitle", false, false),
    numberField("density"),
    stringField("importId")
  ],
  indices: { base: ["layout", "tabBy", "groupBy"], search: ["label"] }
} as const satisfies DatafnResourceDefinition;

export const features = {
  system: {
    resources: [accessLog],
    relations: []
  },
  memory: {
    resources: [capture, node, vector],
    relations: [
      {
        from: "node",
        to: "file",
        type: "many-one",
        relation: "file",
        inverse: "nodes",
        fkField: "file"
      },
      {
        from: "node",
        to: "node",
        type: "many-one",
        relation: "parent",
        inverse: "childNodes",
        fkField: "parent",
        inheritsInactive: true
      }
    ]
  },
  collections: {
    resources: [collection, linkTag, property, view],
    relations: [
      {
        from: "collection",
        to: "property",
        type: "many-many",
        relation: "properties",
        inverse: "schemaCollections",
        joinTable: "collection_properties",
        joinColumns: { from: "collectionId", to: "propertyId" },
        metadata: [{ name: "sortOrder", type: "number" }],
        capabilities: ["timestamps", "audit"]
      },
      {
        from: "collection",
        to: "collection",
        type: "many-one",
        relation: "typeToExtend",
        inverse: "extensionTypes",
        fkField: "typeToExtend"
      },
      {
        from: "collection",
        to: "view",
        type: "many-many",
        relation: "views",
        inverse: "collections",
        joinTable: "collection_views",
        joinColumns: { from: "collectionId", to: "viewId" },
        metadata: [{ name: "sortOrder", type: "number" }],
        capabilities: ["timestamps", "audit"]
      },
      {
        from: ["node", "objective"],
        to: "collection",
        type: "many-many",
        relation: "collections",
        inverse: "items",
        joinTable: "collection_items",
        joinColumns: { from: "itemId", to: "collectionId" },
        metadata: [
          { name: "location", type: "string" },
          { name: "sortOrder", type: "number" }
        ],
        capabilities: ["timestamps", "audit"]
      },
      {
        from: ["node", "objective", "task", "event"],
        to: ["node", "objective", "task", "event"],
        type: "many-many",
        relation: "links",
        inverse: "backlinks",
        joinTable: "record_links",
        joinColumns: { from: "in", to: "out" },
        onDelete: "detach",
        metadata: [
          { name: "linkType", type: "string" },
          { name: "location", type: "string" },
          { name: "tags", type: "json" }
        ],
        identityMetadata: ["linkType"],
        capabilities: ["timestamps", "audit"]
      },
      {
        from: ["node", "objective"],
        to: "property",
        type: "many-many",
        relation: "propertyValues",
        inverse: "valueOwners",
        joinTable: "property_values",
        joinColumns: { from: "itemId", to: "propertyId" },
        metadata: [
          { name: "collectionId", type: "string" },
          { name: "value", type: "json" }
        ],
        capabilities: ["timestamps", "audit"]
      }
    ]
  },
  spaces: {
    resources: [space],
    relations: [
      {
        from: "space",
        to: ["node", "objective", "task", "collection", "file", "event"],
        type: "many-many",
        relation: "items",
        inverse: "spaces",
        joinTable: "space_items",
        joinColumns: { from: "spaceId", to: "itemId" },
        metadata: [
          { name: "itemType", type: "string" },
          { name: "label", type: "string" },
          { name: "description", type: "string" },
          { name: "sortOrder", type: "number" },
          { name: "parentId", type: "string" }
        ],
        capabilities: ["timestamps", "audit"]
      }
    ]
  },
  calendar: {
    resources: [event],
    relations: []
  },
  files: {
    resources: [file],
    relations: []
  },
  focus: {
    resources: [objective, session, sessionLog, task],
    relations: [
      {
        from: "objective",
        to: "objective",
        type: "htree",
        relation: "children",
        inverse: "parent",
        fkField: "parentId",
        pathField: "parentPath",
        inheritsInactive: true
      },
      {
        from: "task",
        to: "objective",
        type: "many-one",
        relation: "objective",
        inverse: "tasks",
        fkField: "objectiveId",
        inheritsInactive: true
      },
      {
        from: "session",
        to: ["objective", "task"],
        type: "many-many",
        relation: "items",
        inverse: "sessions",
        joinTable: "session_items",
        joinColumns: { from: "sessionId", to: "itemId" },
        metadata: [
          { name: "parentObjectiveId", type: "string" },
          { name: "sortOrder", type: "number" },
          { name: "blocks", type: "json" }
        ],
        capabilities: ["timestamps", "audit"],
        onDelete: "detach"
      },
      {
        from: "sessionLog",
        to: "session",
        type: "many-one",
        relation: "session",
        inverse: "logs",
        fkField: "sessionId",
        onDelete: { to: "cascade" }
      },
      {
        from: "sessionLog",
        to: "objective",
        type: "many-one",
        relation: "objective",
        inverse: "sessionLogs",
        fkField: "objectiveId"
      },
      {
        from: "sessionLog",
        to: "task",
        type: "many-one",
        relation: "task",
        inverse: "sessionLogs",
        fkField: "taskId"
      }
    ]
  }
} as const satisfies Record<string, FeatureDefinition>;

export type FeatureId = keyof typeof features;

export const allFeatureIds = [
  "system",
  "memory",
  "collections",
  "spaces",
  "calendar",
  "files",
  "focus"
] as const satisfies readonly FeatureId[];

export const productFeatures: Record<
  Product,
  readonly FeatureId[]
> = {
  [Product.NUCLEUM]: allFeatureIds,
  [Product.MEMOTRON]: ["system", "memory", "collections", "files"],
  [Product.POINTRON]: ["system", "focus", "calendar", "collections"]
};

function uniqueFeatureIds(
  featureIds: readonly FeatureId[]
): FeatureId[] {
  return [...new Set(featureIds)];
}

function filterRelationEndpoint(
  endpoint: DatafnRelationEndpoint,
  names: Set<string>
): DatafnRelationEndpoint | null {
  if (typeof endpoint === "string") {
    return names.has(endpoint) ? endpoint : null;
  }
  const next = endpoint.filter((name) => names.has(name));
  return next.length > 0 ? next : null;
}

function relationKey(relation: DatafnRelationDefinition) {
  const joinTable =
    typeof relation.joinTable === "string" ? relation.joinTable : "";
  const fkField = typeof relation.fkField === "string" ? relation.fkField : "";
  const relationName =
    typeof relation.relation === "string" ? relation.relation : "";
  const inverse = typeof relation.inverse === "string" ? relation.inverse : "";
  return `${joinTable || fkField}:${relationName}:${inverse}`;
}

type FeatureResource = (typeof features)[FeatureId]["resources"][number];
type FeatureRelation = (typeof features)[FeatureId]["relations"][number];

/** Preserves relation literals while allowing filtered polymorphic endpoint arrays. */
type FilteredRelation<Relation = FeatureRelation> =
  Relation extends DatafnRelationDefinition
    ? Omit<Relation, "from" | "to"> & {
        from: Relation["from"] extends readonly string[]
          ? Relation["from"][number][]
          : Relation["from"];
        to: Relation["to"] extends readonly string[]
          ? Relation["to"][number][]
          : Relation["to"];
      }
    : never;

/** Composed resources and relations retain their declared names and field types. */
export type ComposedDefinition = {
  resources: FeatureResource[];
  relations: FilteredRelation[];
};

/**
 * Builds the DataFn resource and relation lists for a feature set.
 * Cross-feature relations keep only endpoints present in the composed resources.
 */
export function composeDefinition(
  featureIds: readonly FeatureId[]
): ComposedDefinition {
  const resources: FeatureResource[] = [];
  const seen = new Set<string>();
  for (const featureId of uniqueFeatureIds(featureIds)) {
    for (const resource of features[featureId].resources) {
      if (seen.has(resource.name)) continue;
      seen.add(resource.name);
      resources.push(resource);
    }
  }

  const names = new Set(resources.map((resource) => resource.name));
  const relations: FilteredRelation[] = [];
  const seenRelations = new Set<string>();
  for (const featureId of uniqueFeatureIds(featureIds)) {
    for (const relation of features[featureId].relations) {
      const from = filterRelationEndpoint(relation.from, names);
      const to = filterRelationEndpoint(relation.to, names);
      if (!from || !to) continue;
      const next = { ...relation, from, to } as FilteredRelation;
      const key = `${relationKey(next)}:${JSON.stringify(from)}:${JSON.stringify(to)}`;
      if (seenRelations.has(key)) continue;
      seenRelations.add(key);
      relations.push(next);
    }
  }

  return { resources, relations };
}

/**
 * Resource names owned by a product's feature set, including remote-only tables.
 */
export function resolveProductTableNames(
  product: Product | string
): string[] {
  const featureIds = productFeatures[product as Product];
  if (!featureIds) return [];
  return composeDefinition(featureIds).resources.map(
    (resource) => resource.name
  );
}
