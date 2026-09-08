import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import type {
  ICollectible,
  ICollectionExpanded
} from "@nucleum/features/collections/collection.type";
import type { IPropertyValue } from "@nucleum/features/collections/properties/property.type";
import type { IFile } from "@nucleum/stores/files/file.type";
import {
  AccessMode,
  type CaptureOmittedFields,
  type IActiveResource,
  type IResource,
  type IResourceArchivable,
  type IResourceInActivableFromAncestor,
  type IResourceLabeled,
  type IResourceLockable,
  type IResourcePageWithPanels,
  type IResourceShareable,
  type IResourceStarrable,
  type OmitFields,
  type OmitForCapture
} from "@nucleum/datafn/resource.type";
import type { IBlockBody, IMarkdown } from "@nucleum/features/memory/markdown/md.type";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IStore } from "@nucleum/datafn/observable-store.type";
import { ResourcePanelType } from "@nucleum/stores/resources/resource-panel.type";
import type {
  ILink,
  ILinkBase,
  LinkType
} from "@nucleum/datafn/link.type";
import type {
  AnnotationType,
  Scaled
} from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";

type IResourcePropertiesForNode = IResource &
  IResourceLabeled &
  IResourceShareable &
  IResourceStarrable &
  IResourceLockable &
  IResourceArchivable &
  IResourceInActivableFromAncestor &
  ICollectible;

type INodeInterface<
  TType = NodeType,
  TBody = any,
  TMetadata = any
> = IResourcePropertiesForNode & {
  body: TBody;
  contentType: TType;
  metadata?: TMetadata;
  parent?: IRecordId;
  mdChildOrder?: IRecordId[] | INode[];
  sortOrder?: number;
  /**
   * Parent hierarchy for markdown heading nodes
   */
  mdParent?: IRecordId[];
  /**
   * The context in which the node was created i.e. whether nodes like AUDIO or IMAGE or PDF created independantly or from within a markdown as block. Also, for clips, whether the parent is created independently or as a supplementary when a text clip or tweet is created.
   * This helps in determining what to show as individual items in library, resource browser or on a timeline and similar scenarios.
   *
   * Note: In context of search, all root nodes are shown irrespective of the context.
   *
   */
  creationContext?: IRecordId;
  notes?: string;
  url?: string;
  file?: IRecordId;
  /**
   * @deprecated - use cover instead
   * Custom preview image for node thumbnails (especially for markdown nodes)
   */
  previewImage?: IRecordId;
  /**
   * Cover photo for markdown nodes (rendered at the top above title)
   */
  cover?: string;
  /**
   * Calculated avatar from linked type collections
   */
  avatar?: IAvatar[];
  /**
   * @deprecated - use {@link text} instead
   */
  mdText?: string;
  text?: string;
  bodySearch?: string;
  labelSearch?: string;
  config?: any;
  metaType?: NodeMetaType | "";
  /**
   * Used with meta types like Calendar notes as createdAt or updatedAt can be different from date of the calendar notes.
   */
  date?: Date;
};

export type INodeCapture<T extends INodeInterface> = OmitForCapture<T> & {
  id: IRecordId;
};

export enum ListType {
  ORDERED = "ORDERED",
  UNORDERED = "UNORDERED",
  CHECKLIST = "CHECKLIST",
  TOGGLELIST = "TOGGLELIST"
}

export enum NodeMetaType {
  CALENDAR_NOTES = "CALENDAR_NOTES",
  AUDIO_TRANSCRIPT = "AUDIO_TRANSCRIPT"
}

export type LayoutNodeType =
  | NodeType.CARDS
  | NodeType.COLUMNS
  | NodeType.TABS
  | NodeType.ACCORDION
  | NodeType.MEDIA_GRID
  | NodeType.STACK;

export type StructuralNodeType =
  | NodeType.DIVIDER
  | NodeType.DOUBLE_DIVIDER
  | NodeType.TOC;

export type OtherNodeType =
  | NodeType.LATEX
  | NodeType.CALLOUT
  | NodeType.LINK
  | NodeType.EMBED
  | NodeType.TABLE
  | NodeType.NODULAR_MARKDOWN
  | NodeType.COLLECTION_AS_EMBED;

export const headingNodeTypes = [
  NodeType.HEADING1,
  NodeType.HEADING2,
  NodeType.HEADING3,
  NodeType.HEADING4,
  NodeType.HEADING5
];

export const structuralNodeTypes = [
  NodeType.DIVIDER,
  NodeType.DOUBLE_DIVIDER,
  NodeType.TOC
];

export const simpleTextNodeTypeList = [NodeType.SIMPLE_TEXT, NodeType.QUOTE];

export const listNodeTypes = [
  NodeType.LIST,
  NodeType.ORDERED_LIST,
  NodeType.CHECKLIST
];

export const nonSimpleTextNodeTypeList = [
  NodeType.CODE,
  NodeType.CALLOUT,
  ...listNodeTypes
];

export const internalUrlNodeTypeList = [
  NodeType.IMAGE,
  NodeType.VIDEO,
  NodeType.AUDIO,
  NodeType.PDF
];

export const embedNodeTypeList = [
  NodeType.NODE_AS_EMBED,
  NodeType.COLLECTION_AS_EMBED,
  NodeType.TASK_AS_EMBED,
  NodeType.GRAPH_AS_EMBED,
  NodeType.CALENDAR_AS_EMBED,
  NodeType.TOC
];

export const socialProfileNodeTypeList = new Set([
  NodeType.TWITTER_PROFILE,
  NodeType.LINKEDIN_PROFILE,
  NodeType.GITHUB_PROFILE,
  NodeType.BLUESKY_PROFILE,
  NodeType.THREADS_PROFILE,
  NodeType.INSTAGRAM_PROFILE,
  NodeType.FACEBOOK_PROFILE,
  NodeType.MASTODON_PROFILE,
  NodeType.REDDIT_PROFILE
]);

export const socialPostNodeTypeList = new Set([
  NodeType.TWEET,
  NodeType.LINKEDIN_POST,
  NodeType.BLUESKY_POST,
  NodeType.THREADS_POST,
  NodeType.INSTAGRAM_POST,
  NodeType.INSTAGRAM_REEL,
  NodeType.REDDIT_POST,
  NodeType.FACEBOOK_POST,
  NodeType.MASTODON_POST
]);

/**
 * A sub in social platforms - it can be a subreddit, a facebook group, a twitter group, etc.
 */
export const socialSubNodeTypeList = new Set([
  NodeType.REDDIT_SUB,
  NodeType.FACEBOOK_GROUP,
  NodeType.LINKEDIN_GROUP
]);

export type SimpleTextNodeType =
  | NodeType.SIMPLE_TEXT
  | NodeType.QUOTE
  | NodeType.HEADING1
  | NodeType.HEADING2
  | NodeType.HEADING3
  | NodeType.HEADING4
  | NodeType.HEADING5;

export type ListNodeType =
  | NodeType.LIST
  | NodeType.ORDERED_LIST
  | NodeType.CHECKLIST;

type INodeLinkBase = {
  linkType: LinkType;
  /**
   * Link tags
   */
  tags?: IRecordId[];
};

export type INodeLinkThumb = ILinkBase & {
  linkedTo: IRecordId;
  links?: {
    id: IRecordId;
    linkType: LinkType;
    direction?: "incoming" | "outgoing";
    tags?: IRecordId[];
  }[];
};

export type LinkThumbnail = ILink & {
  title: string;
  icon: string;
};

export type INodeMetadata = { location?: any };

/**
 * @deprecated - use ICollectionItemPropertyValue instead
 */
export type INodePropertyValue = {
  id: IRecordId;
  value: IPropertyValue | null;
};

/**
 * @deprecated - use Arrangement instead
 */
export enum NodeThumbnailVariant {
  LIST = "LIST",
  GRID = "GRID",
  TIMELINE = "TIMELINE"
}

export interface INodeStore extends IStore {}

export type INodeHierarchyV1 = {
  id: string;
  factor: number;
  children: INodeHierarchyV1[];
};

export type INodeStructure = {
  id: IRecordId;
  /**
   * Hierarchy factor to determine the nesting of the blocks in nodular markdown
   * Ex: Heading 1 -> 1
   *    Heading 2 -> 2
   */
  factor: number;
  children: IRecordId[];
};

type INodeHasUrl = {
  url: string;
};

type INodeHasParent = {
  parent: IRecordId;
};

type INodeHasText = {
  text: string;
};

type INodeHasLabel = {
  label: string;
};

type INodeHasFile = {
  file: IRecordId;
};

// ===== Media node types =====

export const mediaNodeTypeList = [
  NodeType.IMAGE,
  NodeType.VIDEO,
  NodeType.AUDIO,
  NodeType.PDF,
  NodeType.FILE
];

export type IImageMetadata = INodeMetadata & {
  colors?: string[];
  deviceInfo?: {
    make?: string;
    model?: string;
    software?: string;
    deviceId?: string;
    platform?: string;
    deviceLabel?: string;
  };
  imageDetails?: {
    width?: number;
    height?: number;
    orientation?: string;
    dateTime?: string;
  };
  cameraSettings?: {
    aperture?: string;
    exposureTime?: string;
    iso?: number;
    focalLength?: string;
    flash?: string;
  };
};

export type IAudioMetadata = INodeMetadata & {
  album?: string;
  artist?: string;
  picture?: IRecordId;
  title?: string;
  genre?: string[];
  composer?: string[];
  year?: number;
  copyright?: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  numberOfChannels?: number;
  codec?: string;
};

export interface IAudioBody {
  transcription?: string;
  mdBlocks?: any[];
  duration?: number;
  initTranscription?: boolean;
  transcriptionJobId?: string;
  transcriptionUpdatedAt?: string;
  summary?: string;
}

export type IImageNode = INodeInterface<NodeType.IMAGE, any, IImageMetadata> &
  INodeHasFile;

export type IAudioNode = INodeInterface<
  NodeType.AUDIO,
  IAudioBody,
  IAudioMetadata
> &
  INodeHasFile;

export type IVideoNode = INodeInterface<NodeType.VIDEO, any, any> &
  INodeHasFile;

export type IPDFNode = INodeInterface<NodeType.PDF, any, any> & INodeHasFile;

export type IFileNode = INodeInterface<NodeType.FILE, any, any> & INodeHasFile;

export type IMediaNode =
  | IImageNode
  | IAudioNode
  | IVideoNode
  | IPDFNode
  | IFileNode;

// ===== Layout node types =====

export type IMediaGridItem = {
  id: string;
  file: IRecordId;
  position: {
    auto: number;
    columns: {
      index: number;
      columnNo: number;
    };
  };
};

export enum MediaGridType {
  AUTO = "AUTO",
  COLUMNS = "COLUMNS"
}

export type IMediaGridBody = {
  items: IMediaGridItem[];
  type: MediaGridType;
  gap: number;
  altText: string;
  noOfColumns: number;
  isWideLayout: boolean;
};

export type IMediaGridNode = INodeInterface<
  NodeType.MEDIA_GRID,
  IMediaGridBody,
  INodeMetadata
>;

// ===== Web node types =====

const webNodeTypes = [
  NodeType.WEB_PAGE,
  NodeType.GIST,
  NodeType.WEB_TEXT_BOOKMARK,
  NodeType.WEB_SCREENSHOT,

  NodeType.YOUTUBE_VIDEO,
  NodeType.YOUTUBE_SHORT,
  NodeType.YOUTUBE_CHANNEL,
  NodeType.YOUTUBE_BOOKMARK,
  NodeType.KINDLE_BOOK,
  NodeType.KINDLE_HIGHLIGHT
];
/**
 * Web node types with body.url present.
 */
export const webNodeTypeList = [
  ...webNodeTypes,
  ...Array.from(socialPostNodeTypeList),
  ...Array.from(socialProfileNodeTypeList),
  ...Array.from(socialSubNodeTypeList)
];

export const socialProfileWithImageUnavailable = new Set([
  NodeType.THREADS_POST,
  NodeType.THREADS_PROFILE,
  NodeType.INSTAGRAM_POST,
  NodeType.INSTAGRAM_REEL,
  NodeType.INSTAGRAM_PROFILE,
  NodeType.REDDIT_POST,
  NodeType.REDDIT_PROFILE
]);

export type IWebNodeType =
  | NodeType.WEB_PAGE
  | NodeType.GIST
  | NodeType.WEB_TEXT_BOOKMARK
  | NodeType.WEB_SCREENSHOT
  | NodeType.YOUTUBE_VIDEO
  | NodeType.YOUTUBE_SHORT
  | NodeType.YOUTUBE_CHANNEL
  | NodeType.YOUTUBE_BOOKMARK
  | NodeType.TWEET
  | NodeType.BLUESKY_POST
  | NodeType.THREADS_POST
  | NodeType.LINKEDIN_POST
  | NodeType.INSTAGRAM_POST
  | NodeType.INSTAGRAM_REEL
  | NodeType.TWITTER_PROFILE
  | NodeType.LINKEDIN_PROFILE
  | NodeType.INSTAGRAM_PROFILE
  | NodeType.KINDLE_BOOK
  | NodeType.KINDLE_HIGHLIGHT;

type IGenericWebPageBody = {
  hash: string;
  description?: string;
};
export type IGenericWebPage = INodeInterface<
  NodeType.WEB_PAGE,
  IGenericWebPageBody,
  IWebPageMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IGist = INodeInterface<
  NodeType.GIST,
  IGenericWebPageBody,
  IWebPageMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

type IWebPageMetadata = {
  favicon?: string;
  faviconLink?: string;
  appIconLinks?: string[];
  keywords?: string;
  hostname?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  screenshotFile?: IRecordId;
  browser?: {
    userAgent: string;
    uAData?: any;
  };
};

export type ITextClipBody = {
  /**
   * @deprecated - use text field of node instead
   */
  text: string;
  highlighterId: string;
  pre?: string;
  post?: string;
};
type ITextClipMetadata = {
  container: string;
  anchorNode: string;
  focusNode: string;
  anchorOffset: number;
  focusOffset: number;
};
export type ITextClip = INodeInterface<
  NodeType.WEB_TEXT_BOOKMARK,
  ITextClipBody,
  ITextClipMetadata
> &
  INodeHasUrl &
  INodeHasText &
  INodeHasParent;

export type IVideoBookmarkBody = {
  timestamp: number;
  /**
   * The thumbnail of the video. - file id
   */
  thumbnail?: IRecordId;
  /**
   * @deprecated - use thumbnail instead
   */
  s3Url?: string;
};

export type IVideoBookmarkMetadata = {};

export type IVideoTimestampClip = INodeInterface<
  NodeType.YOUTUBE_BOOKMARK | NodeType.WEB_VIDEO_BOOKMARK,
  IVideoBookmarkBody,
  IVideoBookmarkMetadata
> &
  INodeHasParent;

export type IYoutubeChannelBody = {
  /**
   * @deprecated - use label field of node instead
   */
  title: string;
  description?: string;
  channelImageUrl?: string;
};
export type IYoutubeChannelMetadata = IWebPageMetadata & {
  externalLinks?: string[];
};
export type IYoutubeChannel = INodeInterface<
  NodeType.YOUTUBE_CHANNEL,
  IYoutubeChannelBody,
  IYoutubeChannelMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

type IYoutubeVideoBody = {
  title: string;
  description?: string;
  /**
   * The thumbnail of the video. - file id
   */
  thumbnail?: IRecordId;
  /**
   * @deprecated - use thumbnail instead
   */
  s3Url?: string;
};
type IYoutubeVideoMetadata = IWebPageMetadata & {
  popularity?: number;
  authorName?: string;
  authorUrl?: string;
  thumbnailUrl?: string;
};
export type IYoutubeVideo = INodeInterface<
  NodeType.YOUTUBE_VIDEO,
  IYoutubeVideoBody,
  IYoutubeVideoMetadata
> &
  INodeHasUrl &
  INodeHasLabel;
export type IYoutubeShort = INodeInterface<
  NodeType.YOUTUBE_SHORT,
  IYoutubeVideoBody,
  IYoutubeVideoMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

type IWebScreenshotClipBody = {
  /**
   * The file id
   */
  file: IRecordId;
  /**
   * @deprecated - use file instead
   */
  s3Url?: string;
};
export type IWebScreenshotClip = INodeInterface<
  NodeType.WEB_SCREENSHOT,
  IWebScreenshotClipBody,
  any
>;

type ITweetBody = ISocialPostBody & {
  /**
   * @deprecated - use text field of node instead
   */
  content: string;
};
type ITweetMetadata = ISocialPostMetadata & {
  /**
   * @deprecated - use postId instead
   */
  tweetId?: string;
  /**
   * @deprecated
   */
  replyTo?: string;
};
export type ITweet = INodeInterface<
  NodeType.TWEET,
  ITweetBody,
  ITweetMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

export type IBlueskyPost = INodeInterface<
  NodeType.BLUESKY_POST,
  ISocialPostBody,
  ISocialPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

export type IThreadsPost = INodeInterface<
  NodeType.THREADS_POST,
  ISocialPostBody,
  ISocialPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

type ILinkedInPostMetadata = ISocialPostMetadata & {
  headline?: string;
  links?: string[];
};
export type ILinkedInPost = INodeInterface<
  NodeType.LINKEDIN_POST,
  ISocialPostBody,
  ILinkedInPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

type IInstagramPostMetadata = ISocialPostMetadata & {
  likes?: string;
  isVerified?: boolean;
};
export type IInstagramPost = INodeInterface<
  NodeType.INSTAGRAM_POST,
  ISocialPostBody,
  IInstagramPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;
export type IInstagramReel = INodeInterface<
  NodeType.INSTAGRAM_REEL,
  ISocialPostBody,
  IInstagramPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

type IRedditPostMetadata = ISocialPostMetadata & {
  subreddit: string;
  upvotes?: string;
  commentsCount?: string;
  flair?: string;
  domain?: string;
};
export type IRedditPost = INodeInterface<
  NodeType.REDDIT_POST,
  ISocialPostBody,
  IRedditPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

type IFacebookPostMetadata = ISocialPostMetadata & {
  likes?: string;
  reactions?: string;
  shares?: string;
  comments?: string;
};
export type IFacebookPost = INodeInterface<
  NodeType.FACEBOOK_POST,
  ISocialPostBody,
  IFacebookPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

type IMastodonPostMetadata = ISocialPostMetadata & {
  likes?: string;
  boosts?: string;
  replies?: string;
  visibility?: string;
};
export type IMastodonPost = INodeInterface<
  NodeType.MASTODON_POST,
  ISocialPostBody,
  IMastodonPostMetadata
> &
  INodeHasUrl &
  INodeHasParent &
  INodeHasText;

export type ITwitterProfileBody = ISocialProfileBody & {
  /**
   * @deprecated - use label field of node instead
   */
  name: string;
};
export type ITwitterProfileMetadata = IWebPageMetadata & {
  bioLink?: string;
  bioLinkText?: string;
};
export type ITwitterProfile = INodeInterface<
  NodeType.TWITTER_PROFILE,
  ITwitterProfileBody,
  ITwitterProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type ISocialPostBody = {
  postedAt: number;
  links?: string[];
};

export type ISocialPostMetadata = IWebPageMetadata & {
  postId: string;
  username: string;
  postedAt?: string;
  media?: string[];
  externalLinks?: string[];
};

export type ISocialProfileBody = {
  username: string;
  profileImageUrl: string;
  bio?: string;
};

export type ISocialProfileMetadata = IWebPageMetadata & {
  displayName?: string;
  followersCount?: string;
  followingCount?: string;
  postsCount?: string;
  bannerImageUrl?: string;
  websiteUrl?: string;
  isVerified?: boolean;
};

export type ILinkedInProfileMetadata = IWebPageMetadata & {
  currentPosition?: string;
  currentCompany?: string;
  headline?: string;
  education?: string;
  location?: string;
  connectionCount?: string;
  publicProfileUrl?: string;
};

export type ILinkedInProfile = INodeInterface<
  NodeType.LINKEDIN_PROFILE,
  ISocialProfileBody,
  ILinkedInProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IBlueskyProfile = INodeInterface<
  NodeType.BLUESKY_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IThreadsProfile = INodeInterface<
  NodeType.THREADS_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IRedditProfile = INodeInterface<
  NodeType.REDDIT_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IRedditSub = INodeInterface<
  NodeType.REDDIT_SUB,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IInstagramProfile = INodeInterface<
  NodeType.INSTAGRAM_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IFacebookProfile = INodeInterface<
  NodeType.FACEBOOK_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IMastodonProfile = INodeInterface<
  NodeType.MASTODON_PROFILE,
  ISocialProfileBody,
  ISocialProfileMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IKindleBookBody = {
  id: string;
  author: string;
  asin?: string;
  imageUrl?: string;
  lastAnnotatedDate?: Date;
};
export type IKindleBook = INodeInterface<
  NodeType.KINDLE_BOOK,
  IKindleBookBody,
  IWebPageMetadata
> &
  INodeHasUrl &
  INodeHasLabel;

export type IKindleHighlightBody = {
  id: string;
  /**
   * @deprecated - use text field of node instead
   */
  text: string;
  location?: string;
  page?: string;
  note?: string;
  color?: "pink" | "blue" | "yellow" | "orange";
  createdDate?: Date;
};
export type IKindleHighlight = INodeInterface<
  NodeType.KINDLE_HIGHLIGHT,
  IKindleHighlightBody,
  IWebPageMetadata
> &
  INodeHasParent &
  INodeHasText;

export type IClip =
  | ITweet
  | IBlueskyPost
  | IThreadsPost
  | ILinkedInPost
  | IInstagramPost
  | IInstagramReel
  | IRedditPost
  | IVideoTimestampClip
  | ITextClip
  | IWebScreenshotClip
  | IKindleHighlight;

export type IWebPage =
  | IGenericWebPage
  | IYoutubeChannel
  | IYoutubeVideo
  | IYoutubeShort
  | ITwitterProfile
  | ILinkedInProfile
  | IBlueskyProfile
  | IThreadsProfile
  | IInstagramProfile
  | IInstagramReel
  | IRedditProfile
  | IKindleBook
  | IGist;

export type INodeBody =
  | IBlockBody
  | IMarkdown
  | ITweetBody
  | ISocialPostBody
  | ITwitterProfileBody
  | ISocialProfileBody
  | IVideoBookmarkBody
  | ITextClipBody
  | IWebScreenshotClipBody
  | IKindleHighlightBody;

export type IClipCapture = OmitFields<
  IClip,
  | Extract<
      CaptureOmittedFields,
      "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "id"
    >
  | "label"
  | "url"
  | "parent"
>;

export enum NodeIdPrefix {
  TWITTER_PROFILE = "twitterProfile",
  TWEET = "tweet"
}

/**
 * List of root node types that are shown in the library, resource browser and similar contexts.
 *
 * In context of search, all root nodes are shown along with heading nodes irrespective of the creationContext. In all other places, root nodes with creationContext i.e. nodes created as sub blocks or as supplement will be ignored.
 *
 * Examples for supplements: Twitter profile being saved as supplement when a tweet is clipped. A web page being saved as supplement when a text clip is clipped. A twitter profile or web page can separately be saved without any creationContext i.e. when saving by clicking on clipper tool bar.
 *
 * Supplements are not shown directly in the library, resource browser or timeline to avoid confusion as these are auto created and user might find it confusing to see them. On the other hand, supplements are shown in search results because these supplements are interactable from creationContext page. If the user can click on link to supplement and interact with it from a text clip page or a tweet page, user would expect to go back anytime to the supplement page.
 *
 * Note: Clips belonging to the same parent might be grouped together in places like Timeline. In this case, the supplement (i.e. the parent) is what's shown.
 *
 */
export const rootNodeTypeList = [
  NodeType.NODULAR_MARKDOWN,
  NodeType.NON_NODULAR_MARKDOWN,
  NodeType.PDF,
  NodeType.IMAGE,
  NodeType.VIDEO,
  NodeType.AUDIO,

  ...webNodeTypeList
];

export type INode =
  | INodeInterface<NodeType, IBlockBody, INodeMetadata>
  | IMediaNode
  | IWebPage
  | IClip;

export type IActiveNode = INode &
  IActiveResource &
  IResourcePageWithPanels & {
    md: IMarkdown;
    parent?: INode;
    file?: IFile;
    mdParent?: IRecordId[];
    accessMode: AccessMode;
    focusedBlock?: IRecordId;
    collections?: IRecordId[];
    types?: ICollectionExpanded[];
    wordCount?: number;
    charCount?: number;
    pdfAnnotations?: IPdfBookmarkBody[];
    links?: INodeLinkThumb[];
    clips?: INode[];
    children?: IActiveNode[];
    childrenHierarchy?: IRecordId[];
    blocks?: INode[];
    forelinks?: LinkThumbnail[];
    isShowCoverPicker?: boolean;
  };

export type INodeThumb = INode & {
  file?: IFile;
  parent?: INode;
  mdParent?: IRecordId[];
  bodySearch?: string;
  labelSearch?: string;
};

export enum NodeView {
  CONTENT = "content",
  BIRD = "bird"
}

const canHaveTracesBase = [
  // NodeType.NODULAR_MARKDOWN,
  NodeType.PDF,
  NodeType.WEB_PAGE,
  NodeType.YOUTUBE_VIDEO,
  NodeType.YOUTUBE_SHORT,
  NodeType.KINDLE_BOOK
];

export const canHaveTraces = [
  ...canHaveTracesBase,
  ...Array.from(socialProfileNodeTypeList)
];

export type IVideoBookmarkCapture = INodeHasUrl &
  INodeHasText & {
    contentType:
      | NodeType.YOUTUBE_BOOKMARK
      | NodeType.VIDEO_BOOKMARK
      | NodeType.WEB_VIDEO_BOOKMARK;
    body: IVideoBookmarkBody;
    metadata: IVideoBookmarkMetadata;
  };

export type IPdfBookmarkBody = {
  startPageNumber?: number;
  endPageNumber?: number;
  pageNumber?: number;
  date?: string;
  selectedText?: string;
  /**
   * Highlight color id
   */
  color?: IRecordId;
  comment?: string;
  annotType?: AnnotationType;
  boundingRect?: Scaled;
  rect?: Scaled;
  rects?: Scaled[];
};

export type IPdfBookmarkMetadata = {};
