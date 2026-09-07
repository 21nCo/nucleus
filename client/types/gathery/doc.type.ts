import type { IStore } from "@21n/types/data.type";
import type { INodeThumb } from "@nucleum/features/memory/node/node.type";

export type DocStore = IStore & {
  docs: INodeThumb[];
};

export type Doc = Node;
