import { describe, expect, it, vi } from "vitest";
import {
  createDatafnPublicLink,
  normalizeDatafnPermissions,
  resolveDatafnPublicLinkPrincipal,
  resolveDatafnUserPrincipal,
  shareDatafnRecord,
  shareDatafnResourceScope,
  unshareDatafnRecord
} from "./datafn-sharing.store";
import { datafnRuntime } from "./datafn.store";
import type { NucleumDatafnRuntime } from "./datafn.store";

describe("datafn-sharing.store", () => {
  it("normalizes AuthFn user and public-link principals", () => {
    expect(resolveDatafnUserPrincipal("u1")).toBe("user:u1");
    expect(resolveDatafnUserPrincipal("user:u1")).toBe("user:u1");
    expect(resolveDatafnPublicLinkPrincipal("plink:1")).toBe(
      "public_link:plink:1"
    );
  });

  it("wraps record and resource-scope table shares with immediate permission refresh", async () => {
    const share = vi.fn(async () => undefined);
    const unshare = vi.fn(async () => undefined);
    const getPermissions = vi.fn(async () => [
      {
        principalId: "user:u2",
        level: "viewer",
        grantKind: "record",
        grantedBy: "u1",
        grantedAt: 1
      }
    ]);
    const runtime = {
      client: {
        table: () => ({ share, unshare, getPermissions })
      }
    } as unknown as NucleumDatafnRuntime;

    const afterRecordShare = await shareDatafnRecord({
      resource: "collection",
      id: "col:1",
      principalId: "user:u2",
      level: "viewer",
      runtime
    });
    expect(share).toHaveBeenCalledWith({
      id: "col:1",
      principalId: "user:u2",
      level: "viewer",
      scope: "record"
    });
    expect(afterRecordShare).toEqual([
      {
        principalId: "user:u2",
        level: "viewer",
        grantKind: "record",
        grantedBy: "u1",
        grantedAt: 1,
        sourceRef: null
      }
    ]);

    await shareDatafnResourceScope({
      resource: "collection",
      principalId: "user:u2",
      level: "editor",
      permissionsRecordId: "col:1",
      runtime
    });
    expect(share).toHaveBeenLastCalledWith({
      principalId: "user:u2",
      level: "editor",
      scope: "resource"
    });

    await unshareDatafnRecord({
      resource: "collection",
      id: "col:1",
      principalId: "user:u2",
      runtime
    });
    expect(unshare).toHaveBeenCalledWith({
      id: "col:1",
      principalId: "user:u2",
      scope: "record"
    });
  });

  it("creates public links through the account DataFn endpoint without storing token secrets locally", async () => {
    const create = vi.fn(async () => ({
      id: "plink:1",
      token: "plink:1.secret",
      principalId: "public_link:plink:1",
      resource: "collection",
      recordId: "col:1",
      scope: "record" as const,
      level: "viewer" as const
    }));
    const runtime = {
      client: {
        publicLinks: {
          create,
          revoke: vi.fn(),
          resolve: vi.fn(),
          principalId: (id: string) => `public_link:${id}`,
          authPlugin: vi.fn()
        }
      }
    } as unknown as NucleumDatafnRuntime;
    datafnRuntime.set(runtime);

    const link = await createDatafnPublicLink({
      resource: "collection",
      recordId: "col:1",
      scope: "record",
      level: "viewer"
    });

    expect(link.principalId).toBe("public_link:plink:1");
    expect(link).not.toHaveProperty("tokenHash");
    expect(create).toHaveBeenCalledWith({
      resource: "collection",
      recordId: "col:1",
      scope: "record",
      level: "viewer"
    });
    datafnRuntime.set(null);
  });

  it("normalizes DataFn permission rows from current and legacy shapes", () => {
    expect(
      normalizeDatafnPermissions([
        {
          principalId: "public_link:plink:1",
          level: "viewer",
          grantKind: "scope"
        },
        { userId: "user:u2", level: "editor", grantKind: "record" }
      ])
    ).toEqual([
      {
        principalId: "public_link:plink:1",
        level: "viewer",
        grantKind: "resource",
        grantedBy: null,
        grantedAt: null,
        sourceRef: null
      },
      {
        principalId: "user:u2",
        level: "editor",
        grantKind: "record",
        grantedBy: null,
        grantedAt: null,
        sourceRef: null
      }
    ]);
  });
});
