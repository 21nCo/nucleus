import { writable } from "svelte/store";
import type { SessionComposition } from "@nucleum/features/focus/sessionComposition.type";

/** Shared draft for the visible Advanced focus composition editor. */
export const advancedCompositionDraft = writable<
  SessionComposition | undefined
>(undefined);
