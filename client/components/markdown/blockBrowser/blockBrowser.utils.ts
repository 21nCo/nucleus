import { NodeType } from "@nucleum/features/memory/node/node.type";
import { Embed } from "@21n/types/context.type";
import { InlineType } from "@nucleum/components/markdown/md.type";
import type {
  IBlockBrowserItem,
  IBlockBrowserSection
} from "@nucleum/components/markdown/blockBrowser/blockBrowser.type";

const embedBrowserItem: IBlockBrowserItem = {
  label: "Embed anything",
  description: "Embed block",
  type: NodeType.EMBED,
  icon: "code"
};

let embedSection: IBlockBrowserSection = {
  section: "embed",
  children: [
    embedBrowserItem,
    // {
    //   label: "Embed node",
    //   description: "Embed node block",
    //   type: NodeType.NODE_AS_EMBED,
    //   icon: "circle",
    //   isDisabled: true
    // },
    {
      label: "Embed collection",
      description: "Embed Collection block",
      type: NodeType.COLLECTION_AS_EMBED,
      icon: "collection"
    },
    // {
    //   label: "Task",
    //   description: "Embed Task block",
    //   type: NodeType.TASK_AS_EMBED,
    //   icon: "check-square"
    // },
    {
      label: "Web text clip",
      description: "Embed web text clip",
      type: NodeType.WEB_TEXT_BOOKMARK,
      icon: "highlighter-circle"
    },
    {
      label: "Youtube video",
      description: "Embed youtube video block",
      type: NodeType.YOUTUBE_VIDEO,
      icon: "youtube"
    },
    {
      label: "Tweet",
      description: "Embed tweet block",
      type: NodeType.TWEET,
      icon: "twitter"
    },
    {
      label: "Kindle book",
      description: "Embed kindle book block",
      type: NodeType.KINDLE_BOOK,
      icon: "amazon-logo"
    },
    {
      label: "Kindle highlight",
      description: "Embed kindle highlight block",
      type: NodeType.KINDLE_HIGHLIGHT,
      icon: "bookmark"
    }
    // {
    //   label: "Graph",
    //   description: "Embed node graph",
    //   type: NodeType.GRAPH_AS_EMBED,
    //   icon: "graph",
    //   isDisabled: true,
    //   badge: "planned"
    // },
    // {
    //   label: "Node links tree",
    //   description: "Embed node links tree",
    //   type: NodeType.TREE_OF_LINKS,
    //   icon: "tree-view",
    //   isDisabled: true,
    //   badge: "planned"
    // },
    // {
    //   label: "Calendar",
    //   description: "Embed calendar",
    //   type: NodeType.CALENDAR_AS_EMBED,
    //   icon: "calendar",
    //   isDisabled: true,
    //   badge: "planned"
    // },
    // {
    //   label: "Table of contents",
    //   description: "Embed table of contents block",
    //   type: NodeType.TOC,
    //   icon: "list-bullets",
    //   isDisabled: true,
    //   badge: "planned"
    // }
  ]
};

const dividerBrowserBlockItems: IBlockBrowserItem[] = [
  {
    label: "Divider",
    description: "Divider block",
    type: NodeType.DIVIDER,
    icon: "hugeicons:solid-line-01",
    isShowShortcut: true
  },
  {
    label: "Double Divider",
    description: "Divider block",
    type: NodeType.DOUBLE_DIVIDER,
    icon: "hugeicons:equal-sign",
    isShowShortcut: true
  }
];

let layoutSection: IBlockBrowserSection = {
  section: "layout",
  children: [
    ...dividerBrowserBlockItems,
    {
      label: "Media grid",
      description: "Media grid block",
      type: NodeType.MEDIA_GRID,
      icon: "rectangle-group"
    }
    // {
    //   label: "Cards",
    //   description: "Cards block",
    //   type: NodeType.CARDS,
    //   icon: "grid",
    //   badge: "planned",
    //   isDisabled: true
    // },
    // {
    //   label: "Tabs",
    //   description: "Tabs block",
    //   type: NodeType.TABS,
    //   icon: "tabs",
    //   badge: "planned",
    //   isDisabled: true
    // },
    // {
    //   label: "Accordion",
    //   description: "Accordion block",
    //   type: NodeType.ACCORDION,
    //   icon: "queue-list",
    //   badge: "planned",
    //   isDisabled: true
    // },
    // {
    //   label: "Table",
    //   description: "Table block",
    //   type: NodeType.TABLE,
    //   icon: "table",
    //   badge: "planned",
    //   isDisabled: true
    // },
    // {
    //   label: "Stack",
    //   description: "Stack block",
    //   type: NodeType.STACK,
    //   icon: "stack",
    //   badge: "planned",
    //   isDisabled: true
    // }
  ]
};

const imageBrowserItem: IBlockBrowserItem = {
  label: "Image",
  description: "Image block",
  type: NodeType.IMAGE,
  icon: "image"
};

let mediaSection: IBlockBrowserSection = {
  section: "media",
  children: [
    imageBrowserItem,
    {
      label: "Audio",
      description: "Audio block",
      type: NodeType.AUDIO,
      icon: "music-note"
    },
    {
      label: "Video",
      description: "Video block",
      type: NodeType.VIDEO,
      icon: "video"
    },
    {
      label: "PDF",
      description: "Pdf block",
      type: NodeType.PDF,
      icon: "file-pdf"
    },
    {
      label: "File",
      description: "File block",
      type: NodeType.FILE,
      icon: "file"
    }
    // {
    //   label: "Sketch",
    //   description: "Sketch block",
    //   type: NodeType.SKETCH,
    //   icon: "ri:sketching",
    //   badge: "planned",
    //   isDisabled: true
    // }
  ]
};

const orderedListBrowserItem: IBlockBrowserItem = {
  label: "Ordered List",
  description: "Ordered List block",
  type: NodeType.ORDERED_LIST,
  // icon: "lucide:list-ordered"
  icon: "list-ordered",
  isShowShortcut: true
};
let listsSection: IBlockBrowserSection = {
  section: "lists",
  children: [
    {
      label: "Unordered List",
      description: "Unordered List block",
      type: NodeType.LIST,
      // icon: "lucide:list"
      icon: "list-bullets",
      isShowShortcut: true
    },
    orderedListBrowserItem,
    {
      label: "Checklist",
      description: "Checklist block",
      type: NodeType.CHECKLIST,
      // icon: "lucide:list-todo"
      icon: "list-check",
      isShowShortcut: true
    }
  ]
};

let inlineSection: IBlockBrowserSection = {
  section: "inline",
  children: [
    {
      label: "Mention",
      description: "Mention a node or a collection",
      type: InlineType.MENTION,
      icon: "at-symbol",
      isShowShortcut: true
    },
    {
      label: "Date",
      description: "Mention a date",
      type: InlineType.DATE,
      icon: "calendar-days",
      badge: "planned",
      isDisabled: true
    },
    {
      label: "Mention link",
      description: "Mention a link",
      type: InlineType.LINK_MENTION,
      icon: "link",
      badge: "planned",
      isDisabled: true
    }
  ]
};

export const paragraphBrowserItem: IBlockBrowserItem = {
  label: "Paragraph",
  description: "Paragraph block",
  type: NodeType.SIMPLE_TEXT,
  icon: "paragraph"
};
export const quoteBrowserItem: IBlockBrowserItem = {
  label: "Quote",
  description: "Quote block",
  type: NodeType.QUOTE,
  icon: "quote",
  isShowShortcut: true
};
export const calloutBrowserItem: IBlockBrowserItem = {
  label: "Callout",
  description: "Callout block",
  type: NodeType.CALLOUT,
  icon: "info",
  isShowShortcut: true
};
export const codeBrowserItem: IBlockBrowserItem = {
  label: "Code",
  description: "Code block",
  type: NodeType.CODE,
  icon: "code-block",
  isShowShortcut: true
};
export const latexBrowserItem: IBlockBrowserItem = {
  label: "Latex",
  description: "Latex block",
  type: NodeType.LATEX,
  icon: "sigma",
  badge: "planned",
  isDisabled: true
};

let textSection: IBlockBrowserSection = {
  section: "Text",
  children: [
    paragraphBrowserItem,
    quoteBrowserItem,
    calloutBrowserItem,
    codeBrowserItem
    // latexBrowserItem
  ]
};

function resolveHeadingSection(contentType: NodeType): IBlockBrowserSection {
  const isHeading1Disabled =
    contentType === NodeType.HEADING1 ||
    contentType === NodeType.HEADING2 ||
    contentType === NodeType.HEADING3 ||
    contentType === NodeType.HEADING4;
  const isHeading2Disabled =
    contentType === NodeType.HEADING2 ||
    contentType === NodeType.HEADING3 ||
    contentType === NodeType.HEADING4;
  const isHeading3Disabled =
    contentType === NodeType.HEADING3 || contentType === NodeType.HEADING4;
  const isHeading4Disabled = contentType === NodeType.HEADING4;
  const tooltip = "Some headings are not available when a heading is zoomed in";
  return {
    section: "headings",
    children: [
      {
        label: "Heading 1",
        description: "Heading 1 block",
        type: NodeType.HEADING1,
        // icon: "lucide:heading-1"
        icon: "text-h1",
        isShowShortcut: true,
        isDisabled: isHeading1Disabled,
        badge: isHeading1Disabled ? "NA" : undefined,
        tooltip: isHeading1Disabled ? tooltip : undefined
      },
      {
        label: "Heading 2",
        description: "Heading 2 block",
        type: NodeType.HEADING2,
        // icon: "lucide:heading-2"
        icon: "text-h2",
        isShowShortcut: true,
        isDisabled: isHeading2Disabled,
        badge: isHeading2Disabled ? "NA" : undefined,
        tooltip: isHeading2Disabled ? tooltip : undefined
      },
      {
        label: "Heading 3",
        description: "Heading 3 block",
        type: NodeType.HEADING3,
        // icon: "lucide:heading-3"
        icon: "text-h3",
        isShowShortcut: true,
        isDisabled: isHeading3Disabled,
        badge: isHeading3Disabled ? "NA" : undefined,
        tooltip: isHeading3Disabled ? tooltip : undefined
      },
      {
        label: "Heading 4",
        description: "Heading 4 block",
        type: NodeType.HEADING4,
        // icon: "lucide:heading-4"
        icon: "text-h4",
        isShowShortcut: true,
        isDisabled: isHeading4Disabled,
        badge: isHeading4Disabled ? "NA" : undefined,
        tooltip: isHeading4Disabled ? tooltip : undefined
      }
      // {
      //   label: "Heading 5",
      //   description: "Heading 5 block",
      //   type: NodeType.HEADING5,
      //   icon: "lucide:heading-5"
      // }
    ]
  };
}

export function resolveBlockBrowserConfig(params: {
  contentType: NodeType;
  context: any;
}) {
  let headingsSection = resolveHeadingSection(params.contentType);
  //   if (params.context.embed === Embed.HANDSET) {
  //     return [textSection, headingsSection];
  //   }
  return [
    textSection,
    headingsSection,
    listsSection,
    mediaSection,
    layoutSection,
    embedSection
  ];
}

export function resolveBlockBrowserConfigOnKeyboard(params: {
  contentType: NodeType;
  context: any;
}) {
  let headingsSection = resolveHeadingSection(params.contentType);
  //   if (params.context.embed === Embed.HANDSET) {
  //     return [textSection, headingsSection];
  //   }
  return {
    config: [
      {
        section: "quick",
        children: [
          calloutBrowserItem,
          orderedListBrowserItem,
          imageBrowserItem,
          embedBrowserItem
        ]
      },
      {
        section: "text",
        children: []
      },
      mediaSection,
      {
        section: "layout",
        children: [...dividerBrowserBlockItems]
      },
      embedSection
    ],
    listsSection,
    headingsSection
  };
}
