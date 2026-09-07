import type { IContextMenu } from "@21n/elements/contextMenu/context-menu.type";
import type { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

/** Supplies capability-owned actions to reusable thumbnail presentation. */
export type ResourceContextMenuResolver = (
  item: any,
  accessPoint: ResourceAccessPoint,
  params: { accessPointId?: IRecordId; accessPointContext?: string }
) => IContextMenu;
