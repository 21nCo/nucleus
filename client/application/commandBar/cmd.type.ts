import type { IAction } from "@21n/types/action.type";

export type ICommandAction = IAction & {
  cmdLabel: string;
  variant?: string;
};
