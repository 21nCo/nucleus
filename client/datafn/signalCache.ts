export const DATAFN_HEAVY_COMPUTED_SIGNAL_IDLE_TTL_MS = 30 * 60 * 1000;

export const datafnHeavyComputedSignalOptions = {
  cache: {
    idleTtlMs: DATAFN_HEAVY_COMPUTED_SIGNAL_IDLE_TTL_MS
  }
} as const;
