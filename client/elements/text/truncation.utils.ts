

import { Display } from "@21n/elements/display.enum";
import { Size } from "@21n/elements/size.enum";

export function determineTruncateLength(
  display: Display,
  space: Size.sm | Size.md | Size.lg = Size.md
) {
  if (space === Size.lg) {
    if (display === Display.MO || display === Display.CW) {
      return 20;
    } else if (display === Display.TP || display === Display.DP) {
      return 40;
    } else if (display === Display.TK) {
      return 40;
    } else {
      return 20;
    }
  } else if (space === Size.md) {
    if (display === Display.MO || display === Display.CW) {
      return 12;
    } else if (display === Display.TP || display === Display.DP) {
      return 20;
    } else if (display === Display.TK) {
      return 30;
    } else {
      return 12;
    }
  } else {
    if (display === Display.MO || display === Display.CW) {
      return 8;
    } else if (display === Display.TP || display === Display.DP) {
      return 12;
    } else if (display === Display.TK) {
      return 20;
    } else {
      return 8;
    }
  }
}
