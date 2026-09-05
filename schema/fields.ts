import type { CapabilityEntry } from "@datafn/core";

export const shareable: CapabilityEntry = {
  shareable: {
    levels: ["viewer", "editor", "owner"],
    default: "private",
    visibilityDefault: "private",
    supportsScopeGrants: true,
    crossNsShareable: true,
    principalMode: "opaque-id"
  }
};

export const shareableCapabilities: CapabilityEntry[] = [
  "timestamps",
  "audit",
  "trash",
  "archivable",
  shareable
] as CapabilityEntry[];

export const systemCapabilities: CapabilityEntry[] = ["timestamps", "audit"];

export const idField = {
  name: "id",
  type: "string",
  required: true,
  unique: true
} as const;

export const labelField = {
  name: "label",
  type: "string",
  required: false,
  nullable: false
} as const;

export const jsonField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  nullable?: Nullable
) =>
  ({
    name,
    type: "json",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable
  }) as const;

export const objectField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  nullable?: Nullable
) =>
  ({
    name,
    type: "object",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable
  }) as const;

export const arrayField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  defaultValue?: unknown[],
  nullable?: Nullable
) =>
  ({
    name,
    type: "array",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable,
    ...(defaultValue === undefined ? {} : { default: defaultValue })
  }) as const;

export const stringField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  nullable?: Nullable,
  defaultValue?: string
) =>
  ({
    name,
    type: "string",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable,
    ...(defaultValue === undefined ? {} : { default: defaultValue })
  }) as const;

export const numberField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  nullable?: Nullable,
  defaultValue?: number
) =>
  ({
    name,
    type: "number",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable,
    ...(defaultValue === undefined ? {} : { default: defaultValue })
  }) as const;

export const booleanField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  defaultValue?: boolean,
  nullable?: Nullable
) =>
  ({
    name,
    type: "boolean",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable,
    ...(defaultValue === undefined ? {} : { default: defaultValue })
  }) as const;

export const dateField = <
  const Name extends string,
  const Required extends boolean = false,
  const Nullable extends boolean = false
>(
  name: Name,
  required?: Required,
  nullable?: Nullable
) =>
  ({
    name,
    type: "date",
    required: (required ?? false) as Required,
    nullable: (nullable ?? false) as Nullable
  }) as const;

export const commonShareFields = [
  booleanField("isStarred", false, false),
  booleanField("isLocked", false, false),
  booleanField("isAncestorInactive", false, false),
  stringField("importId")
] as const;
