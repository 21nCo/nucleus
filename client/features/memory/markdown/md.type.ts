import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type {
  NodeType,
  ListType,
  SimpleTextNodeType,
  ListNodeType,
  INodeStructure,
  INodeMetadata
} from "@nucleum/features/memory/node/node.type";
import type { IResourceBase } from "@nucleum/datafn/resource.type";

export type IMarkdownStore = IMarkdown & {
  /**
   * @deprecated - use focus writable on MarkdownStore instead
   */
  blockToFocus?: string;
  reRenderBlock?: string;
  params?: IMarkdownParams;
  /**
   * Id of the heading that is currently focused - focus can be on any block under the heading
   */
  activeHeading?: IRecordId;
  /**
   * Headings that are visible in the viewport
   */
  headingsInView: IRecordId[];
};
export type IMarkdown = { blocks: IBlock[] };
export type DbBlock = IResourceBase & IBlockInterface;

export type IBlockInterface<TType = NodeType, TBody = IBlockBody> = {
  id: IRecordId;
  body: TBody;
  contentType: TType;
  /**
   * label will be present if heading nodes
   */
  label?: string;
  metadata?: INodeMetadata;
  childrenHierarchy?: IRecordId[];
};

export enum InlineType {
  MENTION = "MENTION",
  DATE = "DATE",
  LINK = "LINK",
  LINK_MENTION = "LINK_MENTION",
  CODE = "CODE",
  BOLD = "BOLD",
  ITALIC = "ITALIC",
  UNDERLINE = "UNDERLINE",
  STRIKE = "STRIKE",
  SUBSCRIPT = "SUBSCRIPT",
  SUPERSCRIPT = "SUPERSCRIPT"
}

export type IMarkdownParams = {
  isNodular?: boolean;
  placeholder?: string;
  actions?: string[];
  isReadOnly?: boolean;
  title?: string;
  canUseSlashShortcut?: boolean;
  isPreventFocusOnLoad?: boolean;
};

/**
 * @deprecated
 */
export enum BlockContext {
  DEFAULT = "DEFAULT",
  LIST_CHILD = "LIST_CHILD"
}

export type IListOperation = {
  operation: "tab" | "shifttab";
  id: string;
  parentHierarchy: string[];
};

export type IBlockOperationContext = {
  source: IRecordId;
  blockType?: NodeType;
  /**
   * @deprecated - use {@link IListBlockBody} instead
   */
  listType?: ListType;
  body?: any;
};

export enum BlockAction {
  CONVERT = "convert",
  INSERT = "insert",
  INSERT_MANY = "insert_many",
  MENTION = "mention",
  DELETE = "delete",
  DELETE_MANY = "delete_many",
  MOVEUP = "moveup",
  MOVEDOWN = "movedown",
  LINK = "link",
  DUPLICATE = "duplicate",
  COPY_LINK = "COPY_LINK",
  INSERT_ABOVE = "INSERT_ABOVE",
  INSERT_BELOW = "INSERT_BELOW",
  COPY_BLOCK_TEXT = "COPY_BLOCK_TEXT",
  GO_TO_EXTERNAL_LINK = "GO_TO_EXTERNAL_LINK",
  FOCUS = "FOCUS",
  OPEN_AS_SPLIT = "OPEN_AS_SPLIT",
  OPEN_IN_FULL_SCREEN = "OPEN_IN_FULL_SCREEN",
  OPEN_AS_TAB = "OPEN_AS_TAB",
  COLOR = "COLOR",
  CALLOUT_SETTINGS = "CALLOUT_SETTINGS",
  SHORTCUTS = "SHORTCUTS",
  DOWNLOAD = "DOWNLOAD",
  /**
   * Toggles whether to show preview or not for specific embed blocks like pdf, web page etc.
   */
  EMBED_PREVIEW_TOGGLE = "EMBED_PREVIEW_TOGGLE",

  /**
   * Content change event
   */
  CHANGE = "change",
  TAB = "tab",
  SHIFT_TAB = "shifttab",
  /**
   * Triggered when backspace is pressed with content in the block and at the start of the block
   */
  BACKSPACE_WITH_CONTENT = "BACKSPACE_WITH_CONTENT",
  PASTE = "paste"
}

export type IMarkdownSettings = {
  callout: ICalloutSetting[];
};
export type ICalloutSetting = {
  id: string;
  avatar: IAvatar;
  color: number;
  label: string;
};

export type IEmbedBlockBody = {
  /**
   * Id of the media node that is embedded.
   */
  id?: IRecordId;
  subType?: NodeType;
  isHidePreview?: boolean;
  height?: number;
  /**
   * If direct url embed
   */
  url?: string;
};

export type ICalloutBody = {
  text: string;
  callout?: ICalloutSetting;
};

export type ICodeBlockBody = {
  text: string;
  language?: string;
};

export type IListBlockBody = {
  text: string;
  indent: number;
  checked?: boolean;
  order?: number;
};

export type INonSimpleTextBlockBody =
  | ICodeBlockBody
  | IListBlockBody
  | ICalloutBody;

export type IBlockBody = INonSimpleTextBlockBody | IEmbedBlockBody | string;

export type ISimpleTextBlock = IBlockInterface<SimpleTextNodeType, string>;
export type IDividerBlock = IBlockInterface<NodeType.DIVIDER>;
export type IDoubleDividerBlock = IBlockInterface<NodeType.DOUBLE_DIVIDER>;
export type IMediaGridBlock = IBlockInterface<NodeType.MEDIA_GRID>;
export type IEmbedBlock = IBlockInterface<NodeType.EMBED, IEmbedBlockBody>;
export type IListBlock = IBlockInterface<ListNodeType, IListBlockBody>;
export type ICodeBlock = IBlockInterface<NodeType.CODE, ICodeBlockBody>;
export type ICalloutBlock = IBlockInterface<NodeType.CALLOUT, ICalloutBody>;

export type IBlock =
  | IEmbedBlock
  | IListBlock
  | ICodeBlock
  | ICalloutBlock
  | IDividerBlock
  | IDoubleDividerBlock
  | IMediaGridBlock
  | ISimpleTextBlock;

export type IEscapeShortcut = {
  shortcut: string | RegExp;
  type: NodeType;
  indentable?: boolean;
  isRegex?: boolean;
  isChecked?: boolean;
};

export interface IMarkdownTemplate {
  body: IMarkdown;
  childrenWithStructure: INodeStructure[];
  rootStructure: string[];
  text?: string;
}
