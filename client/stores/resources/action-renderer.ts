import type { Component } from "svelte";

/** Application action presentation used by shared controls with named custom cells. */
export type ActionRenderer = Component<{ path?: string; params?: any }>;

let renderer: ActionRenderer | undefined;

/** Installs named-action rendering from the application shell. */
export function configureActionRenderer(value: ActionRenderer) {
  renderer = value;
}

/** Requires application composition only when rendering a named action. */
export function requireActionRenderer(): ActionRenderer {
  if (!renderer) throw new Error("Action renderer has not been configured");
  return renderer;
}
