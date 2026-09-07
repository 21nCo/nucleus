import type { IResource } from "@nucleum/datafn/resource.type";

export type QueryParams =
  | string
  | number
  | boolean
  | string[]
  | IResource
  | IResource[]
  | MergeRecord;

export type MergeRecord = Partial<IResource> & Required<Pick<IResource, "id">>;
