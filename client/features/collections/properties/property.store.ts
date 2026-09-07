import {
  type IProperty,
  type IPropertyEditorStore,
  PropertyType,
  UniversalPropertyType
} from "@nucleum/features/collections/properties/property.type";
import { ObservableStore } from "@nucleum/stores/client.store";
import { PropertyTypeGroup } from "@nucleum/features/collections/properties/propertyTypeSelector/propertyTypeSelector.type";

export class PropertyEditorStore extends ObservableStore<IPropertyEditorStore> {
  constructor() {
    super("propertyEditor");
    this.set({ properties: [] });
  }
  load(data: IProperty[]) {
    this.set({ properties: data });
  }
  reset() {
    this.set({ properties: [] });
  }
}

export const propertyEditorStore = new PropertyEditorStore();

export const autoPropertyOptions = [
  {
    label: "Created time",
    icon: "clock",
    value: PropertyType.CREATED_TIME,
    groupId: PropertyTypeGroup.SYSTEM
  },
  {
    label: "Modified time",
    icon: "clock",
    value: PropertyType.MODIFIED_TIME,
    groupId: PropertyTypeGroup.SYSTEM
  },
  {
    label: "Location",
    icon: "map-pin",
    value: PropertyType.LOCATION,
    groupId: PropertyTypeGroup.SYSTEM
  },
  {
    label: "System ID",
    icon: "hash",
    value: PropertyType.SYSTEM_ID,
    groupId: PropertyTypeGroup.SYSTEM
  },
  // {
  //   label: "Number of visits",
  //   icon: "hash",
  //   value: PropertyType.NUMBER_OF_VISITS,
  //   groupId: PropertyTypeGroup.SYSTEM,
  //   badge: "Planned",
  //   isDisabled: true
  // },
  // {
  //   label: "Links count",
  //   icon: "link",
  //   value: PropertyType.LINKS_COUNT,
  //   isDisabled: true,
  //   badge: "Planned",
  //   groupId: PropertyTypeGroup.SYSTEM
  // },
  {
    label: "Formula",
    icon: "formula",
    value: PropertyType.FORMULA,
    isDisabled: true,
    groupId: PropertyTypeGroup.RULE_BASED
  },
  {
    label: "Custom ID",
    icon: "hash",
    value: PropertyType.CUSTOM_ID,
    isDisabled: true,
    groupId: PropertyTypeGroup.RULE_BASED
  },
  {
    label: "AI autofill",
    icon: "magic-wand",
    value: PropertyType.AI_AUTOFILL,
    isDisabled: true,
    groupId: PropertyTypeGroup.RULE_BASED
  },
  {
    label: "Colors",
    icon: "palette",
    value: PropertyType.COLORS,
    groupId: PropertyTypeGroup.SYSTEM,
    tooltip: "Detects colors from an image node."
  }
  // {
  //   label: "Scene",
  //   icon: "image",
  //   value: PropertyType.SCENE,
  //   isDisabled: true,
  //   badge: "Planned",
  //   groupId: PropertyTypeGroup.SYSTEM
  // }
];

export const universalPropertyOptions = [
  {
    label: "Weather",
    icon: "cloud-sun",
    value: UniversalPropertyType.WEATHER
  },
  {
    label: "Mood log",
    icon: "smiley",
    value: UniversalPropertyType.MOOD_LOG
  },
  {
    label: "Reaction",
    icon: "thumbs-up",
    value: UniversalPropertyType.REACTION
  },
  {
    label: "Country",
    icon: "globe",
    value: UniversalPropertyType.COUNTRY
  },
  {
    label: "Language",
    icon: "translate",
    value: UniversalPropertyType.LANGUAGE
  },
  {
    label: "Currency",
    icon: "currency-dollar",
    value: UniversalPropertyType.CURRENCY
  },
  {
    label: "Continent",
    icon: "map",
    value: UniversalPropertyType.CONTINENT
  },
  {
    label: "Timezone",
    icon: "clock",
    value: UniversalPropertyType.TIMEZONE
  },
  {
    label: "Day of week",
    icon: "calendar",
    value: UniversalPropertyType.DAY_OF_WEEK
  },
  {
    label: "Month",
    icon: "calendar",
    value: UniversalPropertyType.MONTH
  }
];

export const propertyOptions = [
  {
    label: "Text",
    icon: "text",
    value: PropertyType.TEXT,
    groupId: PropertyTypeGroup.TEXT
  },
  {
    label: "Number",
    icon: "hash",
    value: PropertyType.NUMBER,
    groupId: PropertyTypeGroup.TEXT
  },
  {
    label: "Email",
    icon: "mail",
    value: PropertyType.EMAIL,
    groupId: PropertyTypeGroup.TEXT
  },
  {
    label: "Link",
    icon: "link",
    value: PropertyType.URL,
    groupId: PropertyTypeGroup.TEXT
  },
  {
    label: "Single select",
    icon: "caret-circle-down",
    value: PropertyType.SINGLE_SELECT,
    groupId: PropertyTypeGroup.SELECT
  },
  {
    label: "Multi select",
    icon: "list-bullets",
    value: PropertyType.MULTI_SELECT,
    groupId: PropertyTypeGroup.SELECT
  },
  {
    label: "Universal select",
    icon: "globe",
    value: PropertyType.UNIVERSAL,
    groupId: PropertyTypeGroup.SELECT
  },
  {
    label: "Rating",
    icon: "star",
    value: PropertyType.RATING,
    groupId: PropertyTypeGroup.WIZARD
  },
  {
    label: "Date",
    icon: "calendar",
    value: PropertyType.DATE,
    groupId: PropertyTypeGroup.WIZARD
  },
  {
    label: "Checkbox",
    icon: "check-square-offset",
    value: PropertyType.CHECKBOX,
    groupId: PropertyTypeGroup.WIZARD
  }
];
