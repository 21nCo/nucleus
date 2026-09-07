export type IAppContext = {
  isEmbed: boolean;
  isSheet: boolean;
  isTouchDevice: boolean;
  protocol: string;
  embed: Embed;
  os: OperatingSystem;
  dapId: string;
  isInOfflineMode?: boolean;
  isInLowDataMode?: boolean;
  /**
   * Cases like share sheets on mobile devices, iframe embeds on web pages etc.
   */
  isStandaloneSheet?: boolean;
  experiments?: Record<string, unknown>;
};

/**
 * Embedding context of the app when the app is embedded in a web view or similar native container and published as native app.
 */
export enum Embed {
  /**
   * Not an embed
   */
  NONE = "NONE",
  /**
   * App embedded in web view in iOS or Android
   */
  HANDSET = "HANDSET",
  /**
   * App embedded in web view in iPad or Android tablet
   */
  TABLET = "TABLET",
  /**
   * App embedded in web view in a desktop - macOS, Windows, Linux
   */
  DESKTOP = "DESKTOP",
  TV = "TV",
  WATCH = "WATCH",
  CAR = "CAR"
}

/**
 * Operating system of the device
 */
export enum OperatingSystem {
  UNDETERMINED = "UNDETERMINED",
  IOS = "IOS",
  MACOS = "MACOS",
  TVOS = "TVOS",
  ANDROID = "ANDROID",
  WINDOWS = "WINDOWS",
  LINUX = "LINUX",
  CHROME_OS = "CHROME_OS"
}
