import type { TimeUnit } from "@21n/utils/time.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

export type SessionComposition = {
  id: string;
  focusDuration: number;
  breakDuration: number;
  type: SessionCompositionType;
  numberOfBreaks: number;
  totalDuration: number;
  breakType: BreakCompositionType;
  breakReminder: number;
  additional?: SessionComposition[];
  units?: TimeUnit;
  name?: string;
  numberOfFocusRounds?: number;
  objectives?: IRecordId[];
};

export enum SessionCompositionType {
  POMODORO = "Pomodoro",
  TARGET_FOCUS = "Focus target",
  TOTAL_DURATION = "Total duration",
  END_TIME_FIXED = "End time",
  SLIDER = "Slider",
  COUNTUP = "Countup"
}

export enum BreakCompositionType {
  REMINDER = "Reminder",
  PREDEFINED = "Predefined"
}
