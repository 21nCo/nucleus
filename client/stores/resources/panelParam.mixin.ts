import { requireResourcePanelHost } from "./resource-panel-host";
import { logger } from "@nucleum/client/runtime/logging/logger";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

/** Reads the resource panel selected by the composing shell. */
export function resolvePanelParam(
  resourceId: IRecordId,
  url: URL | undefined,
  resourceType?: string
): string | null {
  try {
    if (!url) return null;
    return requireResourcePanelHost().readPanel(resourceId, url);
  } catch (error) {
    logger.error({
      at: `${resourceType} - resolvePanelParam`,
      error,
      resourceId
    });
    return null;
  }
}
