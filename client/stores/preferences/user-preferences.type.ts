import type { AppSkin, Theme } from "@21n/theme/appearance.type";
import type { TimeScale } from "@21n/utils/time.type";
import type { IAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { TranscriptionModel } from "@nucleum/application/taco/worker.type";

export type IUserGlobalPreferences = {
  name: string;
  profilePicture?: IRecordId | undefined;
  // theme: AppSkin;
  // colorScheme: ColorScheme;
  appearance: UserAppearanceSettings;
  birthday?: Date;
  dayStartHour: number;
  dayStartMinute: number;
  tempColorScheme: string;
  accessibilitySizingFactor: number;
  isAnonymousAnalyticsEnabled: boolean;
  timeFormat: string;
  timeZoneOffset: number;
  timeZoneLabel: string;
  timeZone?: string;
  timeScales?: TimeScale[];
  recentCommands?: { action: string; variant?: string }[];
  avatarPicker: {
    skinIndex: number;
    usedEmojis: [IAvatar][];
    iconColor: string;
    filled: boolean;
    usedIcons: [IAvatar][];
  };
  annotations: any[];
  lastUsedTranscriptionModel: TranscriptionModel;

  localAI: {
    semanticSearch: boolean;
    audioTranscription: boolean;
    markdownQAChat: boolean;
    vectorGenerationInProgress: boolean;
  };

  /**
   * @deprecated
   * Temporary
   */
  mediaGridTestitems: any[];
  /**
   * @deprecated
   * Temporary for testing
   */
  infiniteGrid: {
    isGridCreated: boolean;
    grid: any[];
  };
};

export type UserAppearanceSettings = {
  skin: AppSkin;
  isSyncWithSystem: boolean;
  lightColorSchemeId: string;
  darkColorSchemeId: string;
  userThemeSetting: Theme;
  isBlurredBgForPopups?: boolean;
  isFixedLeftNav?: boolean;
  typeface?: string;
};

export type TimeZoneRecord = {
  offset: number;
  date: string;
  label: string;
};
