import { CollectionType } from "@nucleum/features/collections/collection.type";
import type { NodeType } from "@nucleum/features/memory/node/node.type";

export interface CollectionData {
  id: string;
  label: string;
  avatar?: string | null;
  type: CollectionType;
  itemCount: number;
  lastModified?: Date;
}

export interface CollectionItem {
  id: string;
  label: string;
  url?: string;
  metadata?: unknown;
  contentType: NodeType;
  parent?: string;
  body?: unknown;
}
