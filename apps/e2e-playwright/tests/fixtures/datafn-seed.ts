import { createHash } from "node:crypto";
import { expect, type Page, type TestInfo } from "@playwright/test";

import { resolveRepoFsImportPath } from "../utils/repo-fs";

const datafnStorePath = resolveRepoFsImportPath(
  "client/datafn/datafn.store.ts"
);

export type DatafnSeedResource =
  | "collection"
  | "node"
  | "objective"
  | "property"
  | "session"
  | "sessionLog"
  | "task"
  | "view";

export type DatafnSeedMutation = {
  operation:
    | "archive"
    | "delete"
    | "insert"
    | "merge"
    | "relate"
    | "restore"
    | "trash"
    | "unarchive";
  id: string;
  record?: Record<string, unknown>;
  relations?: Record<string, unknown>;
  context?: string;
};

type SeededRecordReference = {
  id: string;
  resource: DatafnSeedResource;
};

function normalizeIdentity(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 36);
}

function resolveTestIdentity(testInfo: TestInfo) {
  const source = [
    testInfo.project.name,
    testInfo.file,
    ...testInfo.titlePath,
    String(testInfo.retry),
    String(testInfo.workerIndex),
    String(Date.now())
  ].join("|");
  const readable = normalizeIdentity(testInfo.title) || "test";
  const digest = createHash("sha1").update(source).digest("hex").slice(0, 10);
  return `${readable}_${digest}`;
}

/**
 * Applies test-data mutations through the initialized application DataFn client.
 */
export class DatafnSeedTransport {
  readonly projectName: string;
  private readonly insertedRecords: SeededRecordReference[] = [];
  private readonly identity: string;
  private sequence = 0;
  private isReady = false;

  constructor(
    private readonly page: Page,
    testInfo: TestInfo
  ) {
    this.projectName = testInfo.project.name;
    this.identity = resolveTestIdentity(testInfo);
  }

  /** Creates a schema-compatible resource ID with test-scoped identity. */
  createId(resource: DatafnSeedResource) {
    this.sequence += 1;
    return `${resource}:e2e_${this.identity}_${this.sequence}`;
  }

  /** Creates a unique, human-readable label for a seeded record. */
  createLabel(prefix: string) {
    this.sequence += 1;
    return `${prefix} ${this.identity}_${this.sequence}`;
  }

  /** Creates a unique identifier for embedded values without schema tables. */
  createEmbeddedId(prefix: string) {
    this.sequence += 1;
    return `${prefix}:e2e_${this.identity}_${this.sequence}`;
  }

  /** Applies one resource's mutations and tracks inserted records for teardown. */
  async mutate(
    resource: DatafnSeedResource,
    input: DatafnSeedMutation | DatafnSeedMutation[],
    options: { trackInserts?: boolean } = {}
  ) {
    await this.waitUntilReady();
    const mutations = Array.isArray(input) ? input : [input];
    await this.page.evaluate(
      async ({ modulePath, mutations, resource }) => {
        const { datafn } = await import(modulePath);
        await datafn.table(resource).mutate(mutations);
      },
      {
        modulePath: datafnStorePath,
        mutations,
        resource
      }
    );
    if (options.trackInserts === false) return;
    for (const mutation of mutations) {
      if (mutation.operation !== "insert") continue;
      this.insertedRecords.push({ id: mutation.id, resource });
    }
  }

  /** Removes records inserted through this transport in reverse dependency order. */
  async cleanup() {
    if (this.page.isClosed() || this.insertedRecords.length === 0) return [];
    const failures: string[] = [];
    const seen = new Set<string>();
    for (const record of [...this.insertedRecords].reverse()) {
      const key = `${record.resource}:${record.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      try {
        await this.page.evaluate(
          async ({ modulePath, record }) => {
            const { datafn } = await import(modulePath);
            await datafn.table(record.resource).mutate({
              operation: "delete",
              id: record.id
            });
          },
          { modulePath: datafnStorePath, record }
        );
      } catch (error) {
        failures.push(`${key}: ${(error as Error).message}`);
      }
    }
    this.insertedRecords.length = 0;
    return failures;
  }

  private async waitUntilReady() {
    if (this.isReady) return;
    await expect
      .poll(
        () =>
          this.page.evaluate(
            async ({ modulePath }) => {
              const { datafnRuntime } = await import(modulePath);
              let product: string | undefined;
              const unsubscribe = datafnRuntime.subscribe(
                (runtime: { product?: string } | null) => {
                  product = runtime?.product;
                }
              );
              unsubscribe();
              return product;
            },
            { modulePath: datafnStorePath }
          ),
        {
          message:
            "DataFn test seeding requires the initialized app runtime and Vite /@fs module access",
          timeout: 20_000
        }
      )
      .toBe(this.projectName);
    this.isReady = true;
  }
}
