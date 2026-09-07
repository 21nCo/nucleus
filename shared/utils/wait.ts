/** Resolves after the requested delay in milliseconds. */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
