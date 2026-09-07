import { logger } from "@nucleum/client/runtime/logging/logger";
import type { INodeThumb } from "@nucleum/features/memory/node/node.type";
import { Dexie, type Table } from "dexie";

const DB_NAME = "tidigit-sheet-storage";
const DB_VERSION = 1;

export type ISheetStoredNode = {
  url: string;
  nodeId: string;
  node: INodeThumb;
  savedAt: number;
  updatedAt: number;
};

class SheetStorageDexie extends Dexie {
  nodes!: Table<ISheetStoredNode, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      nodes: "url,nodeId"
    });
  }
}

let sheetStorageDb: SheetStorageDexie | null = null;

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function resolveDb(): SheetStorageDexie | null {
  if (!isBrowserEnvironment()) return null;
  if (!sheetStorageDb) {
    sheetStorageDb = new SheetStorageDexie();
  }
  return sheetStorageDb;
}

function normalizeUrl(url: string | undefined) {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString();
  } catch (error) {
    const [withoutHash] = trimmed.split("#");
    const [withoutQuery] = withoutHash.split("?");
    return withoutQuery;
  }
}

export async function saveSheetNode(params: {
  url: string;
  node: INodeThumb;
}): Promise<void> {
  try {
    const db = resolveDb();
    if (!db) return;
    const url = normalizeUrl(params.url);
    if (!url || !params.node?.id) return;

    const existing = await db.nodes.get(url);
    const now = Date.now();
    const record: ISheetStoredNode = {
      url,
      nodeId: params.node.id,
      node: params.node,
      savedAt: existing?.savedAt ?? now,
      updatedAt: now
    };

    await db.nodes.put(record);
  } catch (error) {
    logger.error({ at: "sheetStorage.saveSheetNode", error, params });
  }
}

export async function getSheetNodeByUrl(
  url: string | undefined
): Promise<ISheetStoredNode | undefined> {
  try {
    const db = resolveDb();
    if (!db) return undefined;
    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) return undefined;
    return await db.nodes.get(normalizedUrl);
  } catch (error) {
    logger.error({ at: "sheetStorage.getSheetNodeByUrl", error, url });
    return undefined;
  }
}
