import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
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
