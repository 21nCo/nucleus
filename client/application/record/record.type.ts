import type { Resource } from "@nucleum/datafn/resource.enum";

export type IRecentsStore = {
  recents: {
    type: Resource;
    timestamp: Date;
    record: any;
  }[];
  isInitialized: boolean;
};
