/**
 * Throws when a DataFn mutation result represents a failed operation.
 */
export function assertDatafnMutationSucceeded(result: unknown) {
  if (!result) throw new Error("DataFn mutation failed");
  if (Array.isArray(result)) {
    result.forEach(assertDatafnMutationSucceeded);
    return;
  }
  if (
    typeof result === "object" &&
    "ok" in result &&
    (result as { ok?: unknown }).ok === false
  ) {
    throw (
      (result as { error?: unknown }).error ??
      new Error("DataFn mutation failed")
    );
  }
}
