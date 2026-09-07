import { resourceInList } from "@nucleum/datafn/resource.utils";
import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
import {
  type IProperty,
  type IPropertyConfig,
  type IPropertyConfigOption,
  PropertyType,
  UniversalPropertyType
} from "@nucleum/features/collections/properties/property.type";
import type { ISelectItem } from "@21n/types/select.type";
import type { IRecordId } from "@21n/types/data.type";
import { enumToString, isValidString } from "@21n/shared-utils/text.utils";
import type { OmitForCaptureWithId } from "@nucleum/datafn/resource.type";
import {
  propertyOptions,
  universalPropertyOptions
} from "@nucleum/features/collections/properties/property.store";
import { AvatarType } from "@21n/types/avatar.type";
import { iso31661CountryCodes } from "@nucleum/features/collections/properties/countries";
import { languages } from "@nucleum/features/collections/properties/languages";
import type { ICollectionItemPropertyValue } from "@nucleum/features/collections/collection.type";

export function resolvePropertyDefaultValue(type: PropertyType) {
  switch (type) {
    case PropertyType.TEXT:
      return "";
    case PropertyType.CHECKBOX:
      return false;
    case PropertyType.RATING:
      return 0;
    case PropertyType.SINGLE_SELECT:
      return "none";
    case PropertyType.MULTI_SELECT:
      return [];
  }
}

export function resolveIsMultiSelectProperty(property: IProperty) {
  return (
    property.type === PropertyType.MULTI_SELECT ||
    (property.type === PropertyType.UNIVERSAL &&
      Boolean(property.config?.isMultiSelect))
  );
}

export function serializePropertyForDatafn(
  property: OmitForCaptureWithId<IProperty>
) {
  const source = property as OmitForCaptureWithId<IProperty> &
    Record<string, unknown>;
  const record = {
    id: source.id,
    label: source.label,
    type: source.type,
    resource: source.resource,
    propertyType: source.propertyType,
    config: source.config,
    options: source.options,
    isRequired: source.isRequired,
    isMulti: source.isMulti,
    isShowOnNodePage: source.isShowOnNodePage,
    isShowOnCapture: source.isShowOnCapture,
    order: source.order,
    defaultValue: source.defaultValue,
    avatar: source.avatar,
    description: source.description,
    importId: source.importId
  } as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined)
  );
}

/**
 * @deprecated
 * @param properties
 * @param nodeProperties
 * @returns
 */
export function mapPropertyValues(
  properties: IProperty[] | undefined,
  nodeProperties: ICollectionItemPropertyValue[] | undefined
) {
  if (!properties) return [];
  return properties.map((property) => {
    const nodeProperty = nodeProperties?.find(resourceInList(property));
    return {
      id: property.id,
      value: nodeProperty?.value ?? resolvePropertyDefaultValue(property.type)
    };
  });
}

/**
 * Filters properties that are marked for capture
 * @param properties
 * @returns
 */
export function resolvePropertiesForCapture(properties: IProperty[]) {
  if (!isValidArrayWithData(properties)) return [];
  return properties.filter((item: IProperty) => {
    return item.isShowOnCapture;
  });
}

/**
 * Filters properties that are marked for capture
 * @param properties
 * @returns
 */
export function resolvePropertiesForNodePage(properties: IProperty[]) {
  if (!isValidArrayWithData(properties)) return [];
  return properties.filter((item: IProperty) => {
    return item.isShowOnNodePage;
  });
}

export const tabAndGroupableProperties = [
  PropertyType.SINGLE_SELECT,
  PropertyType.MULTI_SELECT,
  PropertyType.CHECKBOX,
  PropertyType.RATING,
  PropertyType.UNIVERSAL
];

export function resolvePropertyOptions(
  id: IRecordId,
  properties: IProperty[] | null,
  params?: {
    isBoardView?: boolean;
  }
): ISelectItem[] {
  if (!id || !properties) return [];
  const property = properties.find(resourceInList(id));
  if (!property || !tabAndGroupableProperties.includes(property.type))
    return [];
  if (
    property.type === PropertyType.SINGLE_SELECT ||
    property.type === PropertyType.MULTI_SELECT
  ) {
    if (!property?.config?.options) return [];
    return property.config.options.map((option) => ({
      value: option.id,
      label: option.label,
      color: option.color
    }));
  } else if (property.type === PropertyType.RATING) {
    return [1, 2, 3, 4, 5].map((value) => ({
      value,
      label: params?.isBoardView
        ? property.label + ": " + value.toString()
        : value.toString()
    }));
  } else if (property.type === PropertyType.CHECKBOX) {
    return [
      {
        value: true,
        label: params?.isBoardView ? property.label + ": True" : "True"
      },
      {
        value: false,
        label: params?.isBoardView ? property.label + ": False" : "False"
      }
    ];
  }
  return [];
}

export const assignDefaultLabelAsFallback = (
  property: OmitForCaptureWithId<IProperty>
) => {
  let label = property.label;
  if (!isValidString(label)) {
    if (
      property.type === PropertyType.UNIVERSAL &&
      property.config?.type &&
      property.config.type !== UniversalPropertyType.NONE
    ) {
      label = enumToString(property.config.type);
    } else {
      label = enumToString(property.type);
    }
  }
  return {
    ...property,
    label
  };
};

export function resolvePropertyIcon(property: IProperty) {
  if (property.type === PropertyType.UNIVERSAL) {
    return (
      universalPropertyOptions.find((x) => x.value === property.config?.type)
        ?.icon ?? "ph:globe-light"
    );
  }
  return (
    propertyOptions.find((x) => x.value === property.type)?.icon ??
    "circle-dashed"
  );
}

export function resolvePropertyDefaultConfig(
  type: PropertyType
): IPropertyConfig {
  if (type === PropertyType.RATING) {
    return {
      avatar: "star"
    };
  } else if (
    type === PropertyType.SINGLE_SELECT ||
    type === PropertyType.MULTI_SELECT
  ) {
    return {
      options: [],
      groups: []
    };
  } else if (type === PropertyType.UNIVERSAL) {
    return {
      type: UniversalPropertyType.NONE,
      isMultiSelect: false
    };
  }
  return {};
}

const weatherOptions: IPropertyConfigOption[] = [
  {
    id: "sun",
    label: "Sunny",
    icon: "☀️"
  },
  {
    id: "cloud",
    label: "Cloudy",
    icon: "☁️"
  },
  {
    id: "rain",
    label: "Rainy",
    icon: "🌧️"
  },
  {
    id: "snow",
    label: "Snowy",
    icon: "❄️"
  },
  {
    id: "sun-cloud",
    label: "Sunny with clouds",
    icon: "🌤️"
  },
  {
    id: "hot",
    label: "Hot",
    icon: "🌡️"
  }
];

const moodOptions = [
  {
    id: "fantastic",
    label: "Fantastic",
    icon: "😁"
  },
  {
    id: "great",
    label: "Great",
    icon: "😃"
  },
  {
    id: "good",
    label: "Good",
    icon: "🙂"
  },
  {
    id: "okay",
    label: "Okay",
    icon: "😐"
  },
  {
    id: "bad",
    label: "Bad",
    icon: "☹️"
  }
];

const reactionOptions = [
  {
    id: "like",
    label: "Like",
    icon: "👍"
  },
  {
    id: "dislike",
    label: "Dislike",
    icon: "👎"
  },
  {
    id: "love",
    label: "Love",
    icon: "❤️"
  },
  {
    id: "laugh",
    label: "Laugh",
    icon: "😂"
  },
  {
    id: "sad",
    label: "Sad",
    icon: "😢"
  },
  {
    id: "angry",
    label: "Angry",
    icon: "😡"
  }
];

const dayOfWeekOptions: IPropertyConfigOption[] = [
  {
    id: "sun",
    label: "Sunday"
  },
  {
    id: "mon",
    label: "Monday"
  },
  {
    id: "tue",
    label: "Tuesday"
  },
  {
    id: "wed",
    label: "Wednesday"
  },
  {
    id: "thu",
    label: "Thursday"
  },
  {
    id: "fri",
    label: "Friday"
  },
  {
    id: "sat",
    label: "Saturday"
  }
];

const monthOptions: IPropertyConfigOption[] = [
  {
    id: "jan",
    label: "January"
  },
  {
    id: "feb",
    label: "February"
  },
  {
    id: "mar",
    label: "March"
  },
  {
    id: "apr",
    label: "April"
  },
  {
    id: "may",
    label: "May"
  },
  {
    id: "jun",
    label: "June"
  },
  {
    id: "jul",
    label: "July"
  },
  {
    id: "aug",
    label: "August"
  },
  {
    id: "sep",
    label: "September"
  },
  {
    id: "oct",
    label: "October"
  },
  {
    id: "nov",
    label: "November"
  },
  {
    id: "dec",
    label: "December"
  }
];

export function resolveUniversalPropertyOptions(
  type: UniversalPropertyType
): IPropertyConfigOption[] {
  switch (type) {
    case UniversalPropertyType.COUNTRY:
      return resolveCountryOptions();
    case UniversalPropertyType.LANGUAGE:
      return resolveLanguageOptions();
    case UniversalPropertyType.CURRENCY:
      return resolveCurrencyOptions();
    case UniversalPropertyType.CONTINENT:
      return resolveContinentOptions();
    case UniversalPropertyType.TIMEZONE:
      return resolveTimezoneOptions();
    case UniversalPropertyType.WEATHER:
      return weatherOptions;
    case UniversalPropertyType.MOOD_LOG:
      return moodOptions;
    case UniversalPropertyType.REACTION:
      return reactionOptions;
    case UniversalPropertyType.DAY_OF_WEEK:
      return dayOfWeekOptions;
    case UniversalPropertyType.MONTH:
      return monthOptions;
    default:
      return [];
  }

  function resolveContinentOptions(): IPropertyConfigOption[] {
    return [
      {
        id: "africa",
        label: "Africa"
      },
      {
        id: "asia",
        label: "Asia"
      },
      {
        id: "antarctica",
        label: "Antarctica"
      },
      {
        id: "australia",
        label: "Australia"
      },
      {
        id: "europe",
        label: "Europe"
      },
      {
        id: "northamerica",
        label: "North America"
      },
      {
        id: "southamerica",
        label: "South America"
      }
    ];
  }

  function resolveCountryOptions(): IPropertyConfigOption[] {
    const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
    const countries = iso31661CountryCodes.map((code) => {
      const flag = code
        .toUpperCase()
        .replace(/./g, (char) =>
          String.fromCodePoint(char.charCodeAt(0) + 127397)
        );
      return {
        id: code.toLowerCase(),
        label: `${flag} ${displayNames.of(code) || code}`
      };
    });
    return countries;
  }

  function resolveLanguageOptions(): IPropertyConfigOption[] {
    return languages.map((language) => ({
      id: language.code,
      label: language.name
    }));
  }

  function resolveCurrencyOptions(): IPropertyConfigOption[] {
    return Intl.supportedValuesOf("currency").map((code) => {
      const symbol = new Intl.NumberFormat("en", {
        style: "currency",
        currency: code,
        currencyDisplay: "symbol"
      })
        .format(0)
        .replace(/[0-9.,]/g, "")
        .trim();

      return {
        id: code.toLowerCase(),
        label: `${symbol} ${new Intl.DisplayNames(["en"], { type: "currency" }).of(code) || code}`
      };
    });
  }

  function resolveTimezoneOptions(): IPropertyConfigOption[] {
    return Intl.supportedValuesOf("timeZone").map((zone) => {
      const date = new Date();

      const localDate = new Date(
        date.toLocaleString("en-US", { timeZone: zone })
      );
      const utcDate = new Date(
        date.toLocaleString("en-US", { timeZone: "UTC" })
      );
      const diffMinutes =
        (localDate.getTime() - utcDate.getTime()) / (1000 * 60);

      const hours = Math.floor(Math.abs(diffMinutes) / 60);
      const minutes = Math.abs(diffMinutes) % 60;
      const sign = diffMinutes >= 0 ? "+" : "-";
      const offset = `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      return {
        id: zone.toLowerCase(),
        label: `${zone.replace(/_/g, " ")} (${offset})`
      };
    });
  }
}

export function resolveSelectPropertySelection(
  value: string | string[] | null,
  selected: string,
  params?: { isMultiSelect?: boolean }
): string | string[] {
  if (params?.isMultiSelect) {
    if (value && typeof value === "string") {
      if (value === "none" || value === selected) value = [selected];
      else value = [value, selected];
    } else if (Array.isArray(value)) {
      value = value.filter((x) => x !== "none");
      if (value.includes(selected)) {
        value = value.filter((x) => x !== selected);
      } else {
        value.push(selected);
      }
    } else {
      value = [selected];
    }
    value = value;
  } else {
    value = selected;
  }
  return value;
}

const highVolumeUniversalTypes = [
  UniversalPropertyType.COUNTRY,
  UniversalPropertyType.LANGUAGE,
  UniversalPropertyType.CURRENCY,
  UniversalPropertyType.TIMEZONE
];

export function isHighVolumeUniversalType(
  type: UniversalPropertyType
): boolean {
  return highVolumeUniversalTypes.includes(type);
}
