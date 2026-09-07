import { Product } from "@nucleum/client/config/product.type";

export const e2eProducts = [
  Product.NUCLEUM,
  Product.MEMOTRON,
  Product.POINTRON
] as const;

export type E2EProduct = (typeof e2eProducts)[number];

export type SurfaceKey =
  | "calendar"
  | "calendar.layout.classic"
  | "calendar.layout.bird"
  | "calendar.view.day"
  | "calendar.view.month"
  | "calendar.view.year"
  | "overview.focus"
  | "focus.quickFocus"
  | "library"
  | "library.collections"
  | "library.objectives"
  | "library.tasks"
  | "library.nodes";

export interface SurfaceRoleAnchor {
  role: "button" | "tab" | "tablist" | "link" | "textbox" | "heading";
  name?: string | RegExp;
}

export interface SurfaceContract {
  route?: string;
  triggerTestId?: string;
  triggerRole?: "button" | "tab" | "link";
  triggerName?: string | RegExp;
  triggerText?: string | RegExp;
  anchorTestIds: readonly string[];
  anchorRoles?: readonly SurfaceRoleAnchor[];
  anchorTexts?: readonly (string | RegExp)[];
}

export function isE2EProduct(value: string): value is E2EProduct {
  return (e2eProducts as readonly string[]).includes(value);
}

export function requireE2EProduct(value: string): E2EProduct {
  if (isE2EProduct(value)) return value;
  throw new Error(`Unknown E2E product: ${value}`);
}

const CALENDAR_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerRole: "button",
  triggerName: /^Calendar$/i,
  anchorTestIds: [],
  anchorRoles: [{ role: "button", name: /Today/i }]
};

const CALENDAR_LAYOUT_CLASSIC_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerRole: "button",
  triggerName: /^Columns$/i,
  anchorTestIds: [],
  anchorTexts: [/^(?:D|Day|Days|W|Week|M|Month|Y|Year)$/i]
};

const CALENDAR_LAYOUT_BIRD_SURFACE: SurfaceContract = {
  route: "/calendar",
  anchorTestIds: [],
  anchorTexts: [
    /^(?:P|Parts|D|Day|Days|W|Week|Weeks|M|Month|Months|Y|Year|Years)$/i
  ]
};

const CALENDAR_VIEW_DAY_TIME_ANCHOR_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerText: /^(?:D|Day|Days)$/i,
  anchorTestIds: [],
  anchorTexts: [/^(?:12:00 AM|1:00 AM|2:00 AM|Today)$/i]
};

const CALENDAR_VIEW_DAY_WEEKDAY_ANCHOR_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerText: /^(?:D|Day|Days)$/i,
  anchorTestIds: [],
  anchorTexts: [
    /^(?:Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)$/i
  ]
};

const CALENDAR_VIEW_MONTH_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerText: /^(?:M|Month|Months)$/i,
  anchorTestIds: [],
  anchorTexts: [/^Sun$/i, /^Mon$/i, /^Tue$/i]
};

const CALENDAR_VIEW_YEAR_SURFACE: SurfaceContract = {
  route: "/calendar",
  triggerText: /^(?:Y|Year|Years)$/i,
  anchorTestIds: [],
  anchorTexts: [/^Jan$/i, /^Feb$/i, /^Mar$/i]
};

const OVERVIEW_FOCUS_SURFACE: SurfaceContract = {
  route: "/overview",
  triggerRole: "button",
  triggerName: /^Overview$/i,
  anchorTestIds: [],
  anchorRoles: [{ role: "tablist" }, { role: "tab", name: /^All$/i }]
};

const QUICK_FOCUS_SURFACE: SurfaceContract = {
  triggerRole: "button",
  triggerName: /^Focus$/i,
  anchorTestIds: ["quick-focus-search"],
  anchorRoles: [
    { role: "textbox", name: /Search an objective to quick focus/i }
  ]
};

const QUICK_FOCUS_SURFACE_WITH_TAB: SurfaceContract = {
  ...QUICK_FOCUS_SURFACE,
  anchorRoles: [
    ...(QUICK_FOCUS_SURFACE.anchorRoles ?? []),
    { role: "tab", name: /^Quick Focus$/i }
  ]
};

const LIBRARY_SURFACE: SurfaceContract = {
  route: "/library",
  triggerRole: "button",
  triggerName: /^Library$/i,
  anchorTestIds: ["resource-records-container", "task-library"],
  anchorRoles: [
    { role: "button", name: /^Collections(?:\s+\d+)?$/i },
    { role: "textbox", name: /Search (?:collections|objectives|nodes)/i }
  ]
};

function makeLibrarySurface(
  resourceLabel: string,
  searchLabel: string,
  anchorTestIds: readonly string[] = []
): SurfaceContract {
  return {
    route: "/library",
    triggerRole: "button",
    triggerName: new RegExp(String.raw`^(${resourceLabel})(\s+\d+)?$`, "i"),
    anchorTestIds,
    anchorRoles: searchLabel
      ? [
          {
            role: "textbox",
            name: new RegExp(`Search ${searchLabel}`, "i")
          }
        ]
      : []
  };
}

const LIBRARY_COLLECTIONS_SURFACE = makeLibrarySurface(
  "Collections",
  "collections"
);
const LIBRARY_OBJECTIVES_SURFACE = makeLibrarySurface(
  "Objectives",
  "objectives"
);
const LIBRARY_TASKS_SURFACE = makeLibrarySurface("Tasks", "", ["task-library"]);
const LIBRARY_NODES_SURFACE = makeLibrarySurface("Nodes", "nodes");

type SurfaceResolver = (product: E2EProduct) => SurfaceContract | null;

function isFocusProduct(product: E2EProduct): boolean {
  return product === Product.NUCLEUM || product === Product.POINTRON;
}

function isMemoryProduct(product: E2EProduct): boolean {
  return product === Product.NUCLEUM || product === Product.MEMOTRON;
}

const surfaceResolvers: Record<SurfaceKey, SurfaceResolver> = {
  calendar: () => CALENDAR_SURFACE,
  "calendar.layout.classic": (product) =>
    product === Product.NUCLEUM ? CALENDAR_LAYOUT_CLASSIC_SURFACE : null,
  "calendar.layout.bird": () => CALENDAR_LAYOUT_BIRD_SURFACE,
  "calendar.view.day": (product) =>
    product === Product.NUCLEUM
      ? CALENDAR_VIEW_DAY_TIME_ANCHOR_SURFACE
      : CALENDAR_VIEW_DAY_WEEKDAY_ANCHOR_SURFACE,
  "calendar.view.month": () => CALENDAR_VIEW_MONTH_SURFACE,
  "calendar.view.year": () => CALENDAR_VIEW_YEAR_SURFACE,
  "overview.focus": (product) =>
    isFocusProduct(product) ? OVERVIEW_FOCUS_SURFACE : null,
  "focus.quickFocus": (product) => {
    if (!isFocusProduct(product)) return null;
    return product === Product.POINTRON
      ? QUICK_FOCUS_SURFACE_WITH_TAB
      : QUICK_FOCUS_SURFACE;
  },
  library: () => LIBRARY_SURFACE,
  "library.collections": () => LIBRARY_COLLECTIONS_SURFACE,
  "library.objectives": (product) =>
    isFocusProduct(product) ? LIBRARY_OBJECTIVES_SURFACE : null,
  "library.tasks": (product) =>
    isFocusProduct(product) ? LIBRARY_TASKS_SURFACE : null,
  "library.nodes": (product) =>
    isMemoryProduct(product) ? LIBRARY_NODES_SURFACE : null
};

export function resolveSurfaceContract(
  product: E2EProduct,
  surface: SurfaceKey
): SurfaceContract | null {
  return surfaceResolvers[surface](product);
}
