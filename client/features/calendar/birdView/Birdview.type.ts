export enum Itemtype {
  YEAR = "YEAR",
  MONTH = "MONTH",
  DAY = "DAY"
}

export type YearPhase = {
  startYear: number;
  endYear: number;
  label: string;
  description: string;
  emoji?: string;
};

export type ProgrammedHorizontalWheelEvent = {
  deltaX: number;
  isWheelEvent: boolean;
  isPanelEvent?: boolean;
};
export type ProgrammedVerticalWheelEvent = {
  deltaY: number;
  isWheelEvent: boolean;
  isPanelEvent?: boolean;
};
