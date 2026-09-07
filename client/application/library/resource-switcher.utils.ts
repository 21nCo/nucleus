import { resolveResourceLabel, resolveResourceIcon, availableResources } from "@nucleum/datafn/resource.utils";

import { Resource } from "@nucleum/datafn/resource.enum";

import type { IResourceSwitchItem } from "@21n/elements/select/select.type";

export function resolveResourceSwitcher(): IResourceSwitchItem[] {
  return Object.values(Resource).map((resource) => ({
    label: resolveResourceLabel(resource),
    value: resource,
    icon: resolveResourceIcon(resource),
    isDisabled: !availableResources.has(resource),
    badge: !availableResources.has(resource) ? "Planned" : undefined
  }));
}
