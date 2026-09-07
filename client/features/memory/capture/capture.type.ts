import type { IProperty } from "@nucleum/features/collections/properties/property.type";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";
import type {
  INodeStructure,
  NodeType
} from "@nucleum/features/memory/node/node.type";
import type { LinkType } from "@nucleum/features/memory/linking/link.type";
import type {
  CollectionType,
  ICollectionItemPropertyValue
} from "@nucleum/features/collections/collection.type";
import type { Resource } from "@nucleum/datafn/resource.enum";
import type {
  IActiveResource,
  IResource,
  IResourceShareable
} from "@nucleum/datafn/resource.type";

export enum CaptureMethod {
  MARKDOWN = "MARKDOWN",
  NOTE = "NOTE",
  AUDIO = "AUDIO",
  CAMERA = "CAMERA",
  SKETCH = "SKETCH",
  CANVAS = "CANVAS",
  WEB = "WEB",
  UPLOAD = "UPLOAD",
  SCAN = "SCAN",
  PASTE = "PASTE"
}

export type ICaptureBase = {
  label: string | null;
  method: CaptureMethod;
  /**
   * @deprecated
   * There will no avatar for non type based entries. Use type.avatar instead
   */
  avatar?: IAvatar | null;
  body?: IMarkdown;
  file?: IRecordId;
  childrenWithStructure: INodeStructure[];
  rootStructure: string[];
  links?: ICaptureLink[];
  propertyConfig?: IProperty[];
  propertyValues?: ICollectionItemPropertyValue[];
  /**
   * To trigger refresh of capture page when on appear or reset etc...
   * as change of body object in markdown is not detected by svelte
   */
  refreshId: number;
  /**
   * Used in context of markdown capture - to save embeded content with a creation Context
   */
  nodeId?: IRecordId;
  /**
   * @deprecated - use `clipboard` store instead
   * Used in context of `Insert into markdown` from global paste and global drag and drop upload
   */
  clipboard?: IPasteCaptureData;
};

export type ICaptureCapture = ICaptureBase;

type IResourcePropertiesForCapture = IResource & IResourceShareable;
export type ICapture = ICaptureBase & IResourcePropertiesForCapture;

export type IActiveCapture = IActiveResource &
  ICapture & {
    isEmpty?: boolean;
    isWindowDnD?: boolean;
    isAvoidSaveLeaks?: boolean;
    isSaving?: boolean;
    isLinksExpanded?: boolean;
    isCaptureFromCollectionPage?: boolean;
    bulkQueryParam?: string | null;
    linkQueryParam?: string | null;
    expandedType?: IRecordId | null;
    isProcessingClipboard?: boolean;
  };

export type ICaptureLink = {
  from: IRecordId | "root";
  to: IRecordId;
  linkType: LinkType;
  toType: typeof Resource.node | typeof Resource.collection;
  toSubType?: CollectionType | NodeType;
  location?: IRecordId;
  tags?: IRecordId[];
};

export type IMultiFileCaptureData = {
  files: { file: File; contentType: NodeType }[];
  totalCount: number;
  sizeExceededCount: number;
};

export type IPasteCaptureData = {
  contentType?: NodeType;
  text?: string;
  textMetadata?: {
    isMultiBlockText?: boolean;
    isUrl?: boolean;
    isMarkdown?: boolean;
    isEmbed?: boolean;
    codeLanguage?: string;
  };
  file?: File;
  multipleFiles?: IMultiFileCaptureData;
  error?: string;
};
