import type {
  IResource,
  IResourceLabeled,
  IResourceShareable
} from "@nucleum/datafn/resource.type";
import type { IRecordId } from "@21n/types/data.type";

export interface ILinkTag
  extends IResource, IResourceLabeled, IResourceShareable {
  group?: string;
}

export interface ILinkTagGroup {
  group: string;
  items: ILinkTag[];
}

export enum LinkType {
  DIRECT = "DIRECT",
  MENTION = "MENTION",
  SUGGESTION = "SUGGESTION"
}

export interface ILinkBase {
  linkType?: LinkType;
  /**
   * Link tags
   */
  tags?: IRecordId[];
}

export interface ILinkCapture extends ILinkBase {
  in: IRecordId;
  out: IRecordId;
}

type IResourcePropertiesForLink = IResource & IResourceShareable;

export interface ILink extends ILinkBase, IResourcePropertiesForLink {
  in: IRecordId;
  out: IRecordId;
}

export interface ILinkThumb extends ILinkBase, IResourcePropertiesForLink {
  in: IResource;
  out: IResource;
}
