import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import type { InlineType } from "@21n/elements/markdown/inline.type";

export type IBlockBrowserItem = {
  label: string;
  type: NodeType | InlineType;
  icon: string;
  description?: string;
  badge?: string;
  isDisabled?: boolean;
  tooltip?: string;
  isShowShortcut?: boolean;
};

export type IBlockBrowserSection = {
  section: string;
  children: IBlockBrowserItem[];
  isDisabled?: boolean;
  badge?: string;
};
