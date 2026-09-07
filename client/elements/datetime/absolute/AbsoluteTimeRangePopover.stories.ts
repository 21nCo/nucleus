import { TimeScale } from "@21n/utils/time.type";
import CustomDatePicker from "@21n/elements/datetime/absolute/AbsoluteTimeRangePopover.svelte";

export default {
  component: CustomDatePicker,
  parameters: { layout: "centered" }
};

export const Default = {};

export const withoutProps = {
  Component: CustomDatePicker,
  args: {}
};
export const yearMode = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.YEARS,
    isPickerOpen: false
  }
};
export const yearModePickerOpen = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.YEARS,
    isPickerOpen: true
  }
};
export const monthMode = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.MONTHS,
    isPickerOpen: false
  }
};
export const monthModePickerOpen = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.MONTHS,
    isPickerOpen: true
  }
};
export const dayMode = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.DAYS,
    isPickerOpen: false
  }
};

export const dayModePickerOpen = {
  Component: CustomDatePicker,
  args: {
    scale: TimeScale.DAYS,
    isPickerOpen: true
  }
};
