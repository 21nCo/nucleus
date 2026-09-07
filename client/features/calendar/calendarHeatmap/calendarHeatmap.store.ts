import { Orientation } from "@21n/elements/direction.enum";
import { readable, writable } from "svelte/store";

/**
 * Calendar Heatmap stores
 */
export const CalendarHeatMapData = writable<any>();
export const CalendarHeatMapLayout = writable<
  Orientation.Horizontal | Orientation.Vertical
>(Orientation.Horizontal);
