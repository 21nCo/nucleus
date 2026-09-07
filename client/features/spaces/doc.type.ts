import type { IStore } from "@nucleum/datafn/observable-store.type";
import type { INodeThumb } from "@nucleum/features/memory/node/node.type";

export type DocStore = IStore & {
  docs: INodeThumb[];
};

export type Doc = Node;
