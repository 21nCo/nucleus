import type {
  IResource,
  IResourceShareable
} from "@nucleum/datafn/resource.type";

/**
 * @deprecated - directly extend IResource, IResourceShareable etc instead
 */
export interface IMemotronItemBase extends IResource, IResourceShareable {
  isStarred?: boolean;
}

export enum MemotronEvent {
  BLOCK_HOVER = "blockHover"
}
