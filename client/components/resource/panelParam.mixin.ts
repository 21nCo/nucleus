import { get } from "svelte/store";
import { page } from "$app/stores";
import { appStore } from "@nucleum/stores/app.store";
import { AppSearchParam } from "@21n/types/appStore.type";
import { logger } from "@nucleum/components/debug/logger.client";
import type { IRecordId } from "@21n/types/data.type";

export function resolvePanelParam(
  resourceId: IRecordId,
  resourceType?: string
): string | null {
  try {
    const currentPage = get(page);
    if (!currentPage) return null;

    return currentPage.url.searchParams.get(
      appStore.resolveRecordSpecificSearchParam(
        resourceId,
        AppSearchParam.PANEL
      )
    );
  } catch (error) {
    logger.error({
      at: `${resourceType} - resolvePanelParam`,
      error,
      resourceId
    });
    return null;
  }
}
