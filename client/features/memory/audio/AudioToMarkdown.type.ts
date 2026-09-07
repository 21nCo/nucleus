export interface A2MDBlock {
  id?: string;
  contentType?: string;
  body?: string | { indent: number; text: string; order: number };
  listType?: string;
  children?: A2MDBlock[];
}

export enum ListKeys {
  OL = "ol",
  OL_CHILD = "olchild",
  OL_SUB_CHILD = "olsubchild",
  OL_SUB_SUB_CHILD = "olsubsubchild",
  UL = "ul",
  UL_CHILD = "ulchild",
  UL_SUB_CHILD = "ulsubchild",
  UL_SUB_SUB_CHILD = "ulsubsubchild"
}

export enum HeadingKeys {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  H4 = "h4",
  H5 = "h5",
  H6 = "h6"
}
export enum InlineKeys {
  ITALIC = "italic",
  BOLD = "bold"
}

export enum BlockKeys {
  SIMPLE_TEXT = "simpletext",
  QUOTE = "quote",
  DIVIDER = "divider",
  DOUBLE_DIVIDER = "doubledivider"
}
