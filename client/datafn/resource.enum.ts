import {
  BaseResource,
  MetaResource as SharedMetaResource
} from "@nucleum/schema/resource.enum";
import { NextResource } from "@nucleum/next/resource.enum";

export const Resource = { ...BaseResource, ...NextResource } as const;
export type Resource =
  | (typeof BaseResource)[keyof typeof BaseResource]
  | NextResource;

export const MetaResource = SharedMetaResource;
export type MetaResource = SharedMetaResource;
