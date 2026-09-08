import type { AccessMode } from "@nucleum/datafn/resource.type";
import type { Resource } from "@nucleum/datafn/resource.enum";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type { BulkEditStore } from "./bulkedit.store";

/** Application interactions required by shared resource menu and bulk actions. */
export interface ResourceActionHost {
  copyLink(id: IRecordId): void;
  open(
    id: IRecordId,
    mode: AccessMode,
    options?: { searchParams: Record<string, string | number | boolean | null> }
  ): void;
  close(options: { id?: IRecordId; accessMode: AccessMode }): void;
  maximize(mode: AccessMode, id: IRecordId): void;
  openTab(id: IRecordId): void;
  removeTab(id: IRecordId): void;
  requestLink(options: {
    label?: string;
    resource?: Resource;
    items?: IRecordId[];
    multiSelectStore?: BulkEditStore;
  }): void;
  afterNodeMutation(
    action: "archive" | "unarchive" | "trash",
    ids: IRecordId[]
  ): Promise<unknown>;
}

let resourceActionHost: ResourceActionHost | undefined;

/** Installs the composing shell's resource interactions before user actions run. */
export function configureResourceActionHost(host: ResourceActionHost) {
  resourceActionHost = host;
}

/** Requires an explicit host rather than silently discarding a user action. */
export function requireResourceActionHost(): ResourceActionHost {
  if (!resourceActionHost)
    throw new Error("Resource action host has not been configured");
  return resourceActionHost;
}
