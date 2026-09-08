import type { Resource } from "@nucleum/datafn/resource.enum";

/** Recent resource records and completion state of the initial refresh. */
export type IRecentsStore = {
  recents: {
    type: Resource;
    timestamp: Date;
    record: any;
  }[];
  isInitialized: boolean;
};
