

/**
 * Programmatically set the screen size - Refer tidigit.tailwind.cjs for more details
 */
export enum Display {
  /**
   * Mobile devices
   */
  MO = "mo",
  /**
   * Tablet in portrait, or vertical splits on laptop/desktop/tablet in landscape
   */
  TP = "tp",
  /**
   * Tablet in landscape, laptops
   */
  LP = "lp",
  /**
   * Desktop and larger laptops
   */
  DP = "dp",
  /**
   * 2k : 2K monitors and above, TVs etc
   */
  TK = "2k",
  /**
   * Constrained width: handheld devices like phones, vertical narrow splits on desktop/laptop/tablet
   */
  CW = "cw",
  /**
   * Ultra wide
   */
  UW = "uw",
  CH = "ch",
  VM = "vm"
}
