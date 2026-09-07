import type { IAction } from "@nucleum/application/commandBar/action.type";

export type ICommandAction = IAction & {
  cmdLabel: string;
  variant?: string;
};
