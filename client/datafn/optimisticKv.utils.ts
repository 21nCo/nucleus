import { compareObjects } from "@21n/shared-utils/obj.utils";
import type { OptimisticKvEntries } from "@21n/types/datafn.type";

export function addOptimisticKvEntries(
  pending: OptimisticKvEntries,
  values: Record<string, unknown>
) {
  const tokens = new Map<string, symbol>();
  Object.entries(values).forEach(([key, value]) => {
    const token = Symbol(key);
    const entries = pending.get(key) ?? [];
    pending.set(key, [...entries, { token, value }]);
    tokens.set(key, token);
  });
  return tokens;
}

export function removeOptimisticKvEntries(
  pending: OptimisticKvEntries,
  tokens: Map<string, symbol>
) {
  tokens.forEach((token, key) => {
    const entries = pending.get(key)?.filter((entry) => entry.token !== token);
    if (entries?.length) pending.set(key, entries);
    else pending.delete(key);
  });
}

export function acknowledgeOptimisticKvEntries(
  pending: OptimisticKvEntries,
  authoritative: Record<string, unknown>
) {
  pending.forEach((entries, key) => {
    const acknowledgedIndex = entries.findIndex((entry) =>
      compareObjects(authoritative[key], entry.value)
    );
    if (acknowledgedIndex < 0) return;
    const remaining = entries.slice(acknowledgedIndex + 1);
    if (remaining.length) pending.set(key, remaining);
    else pending.delete(key);
  });
}

export function applyOptimisticKvEntries<T extends Record<string, unknown>>(
  authoritative: T,
  pending: OptimisticKvEntries
): T {
  const optimistic = Array.from(pending, ([key, entries]) => [
    key,
    entries[entries.length - 1]?.value
  ]);
  return { ...authoritative, ...Object.fromEntries(optimistic) };
}
