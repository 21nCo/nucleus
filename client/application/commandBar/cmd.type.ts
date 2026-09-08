import type { IAction } from "@nucleum/client/config/action.type";

export type ICommandAction = IAction & {
  cmdLabel: string;
  variant?: string;
};
