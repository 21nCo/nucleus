import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { Action } from "@nucleum/client/config/action.enum";

export type HorizontalTrail = {
  path: (Action | IRecordId)[];
  isBaseNonRecord?: boolean;
  activated?: Action | IRecordId;
};

export type VerticalTrail = {
  items: IRecordId[];
  base?: Action | IRecordId;
  activated?: Action | IRecordId;
};
