import { writable } from "svelte/store";
import type { SessionComposition } from "@21n/types/pointron/sessionComposition.type";

/** Shared draft for the visible Advanced focus composition editor. */
export const advancedCompositionDraft = writable<
  SessionComposition | undefined
>(undefined);
