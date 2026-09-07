import type {
  IResource,
  IResourceShareable,
  OmitForCaptureWithId
} from "@nucleum/datafn/resource.type";
import type { AvatarWithCode, IconAvatar } from "@21n/elements/avatarPicker/avatar.type";
import type { ICollectionExpanded } from "@nucleum/features/collections/collection.type";

/**
 * @deprecated Use IProperty instead
 */
export interface IPropertyv1 extends IResource, IResourceShareable {
  label: string;
  type: PropertyType;
  default?: boolean | string | number | string[];
  config?: IPropertyConfig;
  order: number;
  isShowOnNodePage?: boolean;
  isShowOnCapture?: boolean;
}

export type IPropertyCapture = OmitForCaptureWithId<IProperty>;

type IResourcePropertiesForPropetyType = IResource & IResourceShareable;

export type IProperty = IResourcePropertiesForPropetyType &
  (
    | ISelectProperty
    | IUniversalProperty
    | IRatingProperty
    | IPropertyInterface<
        Exclude<
          PropertyType,
          | PropertyType.SINGLE_SELECT
          | PropertyType.MULTI_SELECT
          | PropertyType.UNIVERSAL
          | PropertyType.RATING
        >,
        IPropertyConfig
      >
  );

interface IPropertyInterface<TType = PropertyType, TConfig = IPropertyConfig> {
  label: string;
  type: TType;
  config?: TConfig;
  defaultValue?: boolean | string | number | string[];
  isShowOnNodePage?: boolean;
  isShowOnCapture?: boolean;
  order?: number;
}

export type ISelectPropertyConfig = {
  options?: IPropertyConfigOption[];
  groups?: IPropertyConfigOptionGroup[];
};
export type ISelectProperty = IPropertyInterface<
  PropertyType.SINGLE_SELECT | PropertyType.MULTI_SELECT,
  ISelectPropertyConfig
>;

export type IUniversalPropertyConfig = {
  type: UniversalPropertyType;
  isMultiSelect?: boolean;
};
export type IUniversalProperty = IPropertyInterface<
  PropertyType.UNIVERSAL,
  IUniversalPropertyConfig
>;

export type IRatingPropertyConfig = {
  /**
   * @deprecated Use avatar instead
   */
  ratingAvatar?: AvatarWithCode<IconAvatar>;
  avatar: string;
  scale?: number;
};
export type IRatingProperty = IPropertyInterface<
  PropertyType.RATING,
  IRatingPropertyConfig
>;

export type IPropertyConfigOption = {
  id: string;
  label: string;
  /**
   * For Icon select universal properties
   */
  icon?: string;
  color?: number;
  groupId?: string;
};

export type IPropertyConfigOptionGroup = {
  id: string;
  label: string;
};

export type IPropertyConfig =
  | ISelectPropertyConfig
  | IRatingPropertyConfig
  | IUniversalPropertyConfig;

export enum PropertyType {
  //Text
  TEXT = "text",
  NUMBER = "number",
  EMAIL = "email",
  URL = "url",

  //Select options
  SINGLE_SELECT = "single-select",
  MULTI_SELECT = "multi-select",
  UNIVERSAL = "universal",

  CHECKBOX = "checkbox",
  RATING = "rating",
  DATE = "date",
  RANGE = "range",
  /**
   * @deprecated - in favor of pinned links list
   */
  LINK_LIST = "link-list",
  /**
   * @deprecated - in favor of links, embeds
   */
  FILE = "file",

  // System properties
  CREATED_TIME = "created-time",
  MODIFIED_TIME = "modified-time",
  CREATED_BY = "created-by",
  MODIFIED_BY = "modified-by",
  LOCATION = "location",
  NUMBER_OF_VISITS = "number-of-visits",
  SYSTEM_ID = "system-id",

  //Auto properties
  FORMULA = "formula",
  AI_AUTOFILL = "ai-autofill",
  CUSTOM_ID = "custom-id",
  LINKS_COUNT = "links-count",

  //Detection properties
  COLORS = "colors",
  SCENE = "scene",

  //Integration properties
  /**
   * @deprecated - in favor of synced collections, links
   */
  TIME_TRACKING = "time-tracking",
  /**
   * @deprecated - in favor of synced collections, links
   */
  CALENDAR_EVENT = "calendar-event",
  /**
   * @deprecated - in favor of synced collections, links
   */
  OBJECTIVE = "objective",
  /**
   * @deprecated - in favor of synced collections, links
   */
  GIT = "git"
}

export const manualPropertyTypes = [
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.EMAIL,
  PropertyType.URL,
  PropertyType.CHECKBOX,
  PropertyType.DATE,
  PropertyType.RANGE,
  PropertyType.LINK_LIST,
  PropertyType.FILE,
  PropertyType.SINGLE_SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.UNIVERSAL,
  PropertyType.RATING
];

export enum UniversalPropertyType {
  NONE = "none",
  COUNTRY = "country",
  LANGUAGE = "language",
  CURRENCY = "currency",
  CONTINENT = "continent",
  TIMEZONE = "timezone",
  WEATHER = "weather",
  MOOD_LOG = "mood-log",
  REACTION = "reaction",
  DAY_OF_WEEK = "day-of-week",
  MONTH = "month"
}

export const textPropertyTypes = [
  PropertyType.TEXT,
  PropertyType.NUMBER,
  PropertyType.EMAIL,
  PropertyType.URL
];
export const selectOptionsPropertyTypes = [
  PropertyType.SINGLE_SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.UNIVERSAL
];

export const propertyTypesWithUserConfiguration = [
  PropertyType.SINGLE_SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.RATING
];

export type IPropertyValue =
  | string
  | string[]
  | number
  | Date
  | boolean
  | { start: Date; end: Date };

export type IPropertyEditorStore = {
  properties: OmitForCaptureWithId<IProperty>[];
  typeToExtend?: ICollectionExpanded;
};

export const iconSelectPropertyTypes = [
  UniversalPropertyType.WEATHER,
  UniversalPropertyType.MOOD_LOG,
  UniversalPropertyType.REACTION
];
