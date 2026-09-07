import type { NodeType } from "@nucleum/features/memory/node/node.type";
import type { CollectionType } from "@nucleum/features/collections/collection.type";
import type { TaskSubTypeForSwitcher } from "@nucleum/features/focus/tasks/task.type";

export type SubType =
  | "all"
  | "recents"
  | "starred"
  | NodeType
  | CollectionType
  | "incomplete"
  | TaskSubTypeForSwitcher;
