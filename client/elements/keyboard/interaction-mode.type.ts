export enum InteractionMode {
  DEFAULT = "DEFAULT",
  /**
   * @deprecated - merged into default
   */
  KEYBOARD_CENTRIC = "KEYBOARD_CENTRIC",
  /**
   * @deprecated - in favor of AGENT
   */
  COMMAND_ONLY = "COMMAND_ONLY",
  /**
   * @deprecated in favor of AGENT
   */
  VOICE_ONLY = "VOICE_ONLY",
  AGENT = "AGENT"
}
