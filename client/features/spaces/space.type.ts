import type { IStore } from "@nucleum/datafn/observable-store.type";

export type SpaceStore = IStore & {
  spaces: Space[];
};

export type Space = {
  id: string;
  label: string;
  slug: string;
};
