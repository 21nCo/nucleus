import type { IUserGlobalPreferences } from "@nucleum/stores/preferences/user-preferences.type";
import type { IActiveSessionStore } from "@nucleum/features/focus/session.type";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | IUserGlobalPreferences
  | IActiveSessionStore
  | JsonValue[]
  | { [key: string]: JsonValue };
