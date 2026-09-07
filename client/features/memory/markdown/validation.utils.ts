

import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";
import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";

export function isValidMarkdown(md: IMarkdown) {
  return (
    md &&
    md.blocks &&
    isValidArrayWithData(md.blocks) &&
    md.blocks.length > 0 &&
    ((md.blocks.length === 1 &&
      "body" in md.blocks[0] &&
      md.blocks[0].body != "") ||
      md.blocks.length > 1)
  );
}
