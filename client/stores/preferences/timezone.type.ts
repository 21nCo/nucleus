import type { DatafnTimezoneChangeRecord } from "@datafn/client";

export interface ITimezoneCapture {
  timezone?: string;
  zone?: string;
  label?: string;
  offset?: number;
  date?: Date;
  dateUnix?: number;
  effectiveFrom?: number | string | Date;
  recordedAt?: number | string | Date;
  source?: string;
}

export type ITimezone = DatafnTimezoneChangeRecord;
