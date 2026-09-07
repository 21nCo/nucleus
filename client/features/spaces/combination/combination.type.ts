import type {
  IActiveResource,
  IResourceLabeled,
  IResourceStarrable
} from "@nucleum/datafn/resource.type";
import type { Resource } from "@nucleum/datafn/resource.enum";
import type { IMemotronItemBase } from "@nucleum/features/memory/memory.type";
import type { IAvatar } from "@21n/types/avatar.type";
import type { IRecordId } from "@21n/types/data.type";

export enum CombinationNavItemType {
  SECTION = "section",
  RESOURCE = "resource"
}

export interface ICombinationNavItemBase {
  id: string;
  label: string;
  description?: string;
  avatar?: IAvatar;
  children?: ICombinationNavItem[];
}

export interface ICombinationSectionNavItem extends ICombinationNavItemBase {
  type: CombinationNavItemType.SECTION;
}

export interface ICombinationResourceNavItem extends ICombinationNavItemBase {
  type: CombinationNavItemType.RESOURCE;
  resourceId: IRecordId;
  resourceType: Resource;
  resourceLabel?: string;
  resourceAvatar?: IAvatar;
}

export type ICombinationNavItem =
  | ICombinationSectionNavItem
  | ICombinationResourceNavItem;

type ICombinationBase = IMemotronItemBase &
  IResourceLabeled &
  Partial<IResourceStarrable> & {
    type: CombinationType;
    description?: string;
    avatar?: IAvatar;
  };

export interface ISideNavCombination extends ICombinationBase {
  items: ICombinationNavItem[];
}

export type ICombination = ISideNavCombination;

export interface IActiveCombination
  extends IActiveResource, ISideNavCombination {
  isPageLoading?: boolean;
}

export enum CombinationType {
  /**
   * @deprecated - use {@link CombinationType.NOTEBOOK} instead.
   * Side nav is now a view type in notebook.
   *
   * A markdown page can be inserted as a sub side nav (TOC becomes the hierarchy).
   */
  SIDENAV = "sidenav",
  /**
   * @deprecated - use {@link CombinationType.CANVAS} instead.
   */
  WHITEBOARD = "whiteboard",
  /**
   * @deprecated - use {@link CombinationType.CANVAS} instead.
   *
   * A canvas can have option to insert a mind map.
   * A markdown page can be inserted as a mind map (TOC becomes the hierarchy).
   */
  MINDMAP = "mindmap",
  /**
   * @deprecated - use {@link CombinationType.NOTEBOOK} instead. WALL is now a view type in notebook.
   *
   * Infinitely deep structured layout.
   * A markdown page can be inserted as sub wall (TOC becomes the hierarchy).
   */
  WALL = "wall",
  /**
   * @deprecated - use horizontal stack and vertical stack when Calendar scope is activated in Calendar instead.
   * Previous - Pyramid, Funnel views merged into regular timeline view.
   */
  TIMELINE = "timeline",
  NOTEBOOK = "notebook",
  /**
   * @deprecated - Notebook is the only and default layout now and Canvas has moved as a node type instead.
   */
  CANVAS = "canvas"
}
