import { MetaResource, Resource } from "@nucleum/datafn/resource.enum";

/**
 * Resolves the display color token used by classic calendar tile indicators.
 */
export function resolveIndicatorColor(resource: Resource | MetaResource) {
  switch (resource) {
    case Resource.task:
      return "fgs4";
    case Resource.sessionLog:
    case Resource.session:
      return "aps1";
    case Resource.node:
    case MetaResource.calendarNotes:
      return "aps1";
    default:
      return "fgs4";
  }
}
