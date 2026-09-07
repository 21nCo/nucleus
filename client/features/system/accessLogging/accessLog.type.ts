import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { IMetaResource } from "@nucleum/datafn/resource.type";
import type { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";

export interface IAccessLog extends IMetaResource {
  action: ResourceActionType;
  resource: string;
  timestamp: string | number | Date;
  resourceId?: IRecordId;
  context?: string;
  duration?: number;
}
