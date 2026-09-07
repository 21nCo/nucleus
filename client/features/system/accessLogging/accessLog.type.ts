import type { IRecordId } from "@21n/types/data.type";
import type {
  IMetaResource,
  ResourceActionType
} from "@nucleum/datafn/resource.type";

export interface IAccessLog extends IMetaResource {
  action: ResourceActionType;
  resource: string;
  timestamp: string | number | Date;
  resourceId?: IRecordId;
  context?: string;
  duration?: number;
}
