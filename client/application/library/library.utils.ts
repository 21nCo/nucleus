import { Resource } from "@nucleum/datafn/resource.enum";

export function isCustomLibrary(resource: Resource) {
  return [Resource.relation, Resource.task].includes(resource);
}

export function isInlineAvailable(resource: Resource) {
  return ![Resource.relation, Resource.task].includes(resource);
}

export function isHideCreateAction(resource: Resource) {
  return [Resource.relation].includes(resource);
}

export function resolveResourceTooltip(resource: Resource) {
  switch (resource) {
    case Resource.relation:
      return "Use relations to maintain relationship information between nodes.";
    default:
      return undefined;
  }
}
