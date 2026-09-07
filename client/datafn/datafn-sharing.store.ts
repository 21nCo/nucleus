import type { DatafnPublicLinkGrant, PermissionEntry } from "@datafn/client";
import { get } from "svelte/store";
import {
  datafn,
  datafnRuntime,
  type NucleumDatafnRuntime
} from "@nucleum/datafn/datafn.store";
import type { NucleumDatafnResource } from "@nucleum/schema";

export type DatafnShareLevel = "viewer" | "editor" | "owner";
export type DatafnShareScope = "record" | "resource";

export type DatafnPermissionGrant = {
  principalId: string;
  level: string;
  grantKind: DatafnShareScope | "relation_inherited";
  grantedBy?: string | null;
  grantedAt?: number | null;
  sourceRef?: string | null;
};

export function resolveDatafnUserPrincipal(userId: string): string {
  const normalized = userId
    .trim()
    .replace(/^user:/, "")
    .trim();
  if (!normalized) {
    throw new Error("User id is required");
  }
  return `user:${normalized}`;
}

export function resolveDatafnPublicLinkPrincipal(linkId: string): string {
  const normalized = linkId.trim();
  if (!normalized) {
    throw new Error("Public link id is required");
  }
  return datafn.publicLinks.principalId(normalized);
}

export async function shareDatafnRecord(input: {
  resource: NucleumDatafnResource | string;
  id: string;
  principalId: string;
  level: DatafnShareLevel;
  runtime?: NucleumDatafnRuntime | null;
}): Promise<DatafnPermissionGrant[]> {
  const table = resolveShareTable(input.resource, input.runtime);
  await table.share({
    id: input.id,
    principalId: input.principalId,
    level: input.level,
    scope: "record"
  });
  return getDatafnPermissions({
    resource: input.resource,
    id: input.id,
    runtime: input.runtime
  });
}

export async function shareDatafnResourceScope(input: {
  resource: NucleumDatafnResource | string;
  principalId: string;
  level: DatafnShareLevel;
  permissionsRecordId?: string;
  runtime?: NucleumDatafnRuntime | null;
}): Promise<DatafnPermissionGrant[]> {
  const table = resolveShareTable(input.resource, input.runtime);
  await table.share({
    principalId: input.principalId,
    level: input.level,
    scope: "resource"
  });
  if (!input.permissionsRecordId) {
    return [];
  }
  return getDatafnPermissions({
    resource: input.resource,
    id: input.permissionsRecordId,
    runtime: input.runtime
  });
}

export async function unshareDatafnRecord(input: {
  resource: NucleumDatafnResource | string;
  id: string;
  principalId: string;
  runtime?: NucleumDatafnRuntime | null;
}): Promise<DatafnPermissionGrant[]> {
  const table = resolveShareTable(input.resource, input.runtime);
  await table.unshare({
    id: input.id,
    principalId: input.principalId,
    scope: "record"
  });
  return getDatafnPermissions({
    resource: input.resource,
    id: input.id,
    runtime: input.runtime
  });
}

export async function unshareDatafnResourceScope(input: {
  resource: NucleumDatafnResource | string;
  principalId: string;
  permissionsRecordId?: string;
  runtime?: NucleumDatafnRuntime | null;
}): Promise<DatafnPermissionGrant[]> {
  const table = resolveShareTable(input.resource, input.runtime);
  await table.unshare({
    principalId: input.principalId,
    scope: "resource"
  });
  if (!input.permissionsRecordId) {
    return [];
  }
  return getDatafnPermissions({
    resource: input.resource,
    id: input.permissionsRecordId,
    runtime: input.runtime
  });
}

export async function getDatafnPermissions(input: {
  resource: NucleumDatafnResource | string;
  id: string;
  runtime?: NucleumDatafnRuntime | null;
}): Promise<DatafnPermissionGrant[]> {
  const table = resolveShareTable(input.resource, input.runtime);
  const permissions = await table.getPermissions(input.id);
  return normalizeDatafnPermissions(permissions);
}

export async function createDatafnPublicLink(input: {
  resource: NucleumDatafnResource | string;
  recordId?: string | null;
  scope: DatafnShareScope;
  level: DatafnShareLevel;
}): Promise<DatafnPublicLinkGrant> {
  return resolvePublicLinksClient().create({
    resource: input.resource.toString(),
    recordId: input.recordId ?? null,
    scope: input.scope,
    level: input.level
  });
}

/**
 * Builds a recipient URL while keeping the public-link credential in the fragment.
 */
export function resolveDatafnPublicLinkUrl(input: {
  token: string;
  resource: string;
  recordId: string;
  region: string;
}) {
  const url = new URL("/share", window.location.origin);
  url.searchParams.set("resource", input.resource);
  url.searchParams.set("id", input.recordId);
  url.searchParams.set("region", input.region);
  url.hash = new URLSearchParams({ token: input.token }).toString();
  return url.toString();
}

export async function revokeDatafnPublicLink(input: {
  id: string;
}): Promise<void> {
  await resolvePublicLinksClient().revoke({ id: input.id });
}

export function normalizeDatafnPermissions(
  permissions: PermissionEntry[] | unknown
): DatafnPermissionGrant[] {
  if (!Array.isArray(permissions)) {
    return [];
  }
  return permissions
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }
      const record = entry as Record<string, unknown>;
      const principalId =
        typeof record.principalId === "string"
          ? record.principalId
          : typeof record.userId === "string"
            ? record.userId
            : "";
      const level = typeof record.level === "string" ? record.level : "";
      if (!principalId || !level) {
        return null;
      }
      return {
        principalId,
        level,
        grantKind:
          record.grantKind === "scope" || record.grantKind === "resource"
            ? "resource"
            : record.grantKind === "relation_inherited"
              ? "relation_inherited"
              : "record",
        grantedBy:
          typeof record.grantedBy === "string" ? record.grantedBy : null,
        grantedAt:
          typeof record.grantedAt === "number" ? record.grantedAt : null,
        sourceRef:
          typeof record.sourceRef === "string" ? record.sourceRef : null
      } satisfies DatafnPermissionGrant;
    })
    .filter((entry): entry is DatafnPermissionGrant => entry !== null);
}

function resolvePublicLinksClient() {
  const resolvedRuntime = get(datafnRuntime);
  const client = (
    resolvedRuntime && "client" in resolvedRuntime && resolvedRuntime.client
      ? resolvedRuntime.client
      : datafn
  ) as typeof datafn;
  return client.publicLinks;
}

function resolveShareTable(
  resource: NucleumDatafnResource | string,
  runtime: NucleumDatafnRuntime | null | undefined
) {
  const resolvedRuntime = runtime ?? get(datafnRuntime);
  if (!resolvedRuntime) {
    throw new Error("DataFn is not initialized");
  }
  const client = (
    "client" in resolvedRuntime && resolvedRuntime.client
      ? resolvedRuntime.client
      : datafn
  ) as {
    table: (resource: string) => unknown;
  };
  const table = client.table(resource.toString()) as {
    share?: (input: Record<string, unknown>) => Promise<unknown>;
    unshare?: (input: Record<string, unknown>) => Promise<unknown>;
    getPermissions?: (id: string) => Promise<PermissionEntry[]>;
  };
  if (!table.share || !table.unshare || !table.getPermissions) {
    throw new Error(`${resource} does not support DataFn sharing`);
  }
  return {
    share: table.share,
    unshare: table.unshare,
    getPermissions: table.getPermissions
  };
}
