import type { AccessMode } from "@nucleum/datafn/resource.type";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

/** Shell navigation required by shared resource panels. */
export interface ResourcePanelHost {
  readPanel(id: IRecordId, url: URL): string | null;
  writePanel(id: IRecordId, panel: string): void;
  close(id: IRecordId): void;
  goBack(): void;
  maximize(mode: AccessMode, id: IRecordId): void;
}

let host: ResourcePanelHost | undefined;

/** Installs navigation from the composing application shell. */
export function configureResourcePanelHost(value: ResourcePanelHost) {
  host = value;
}

/** Requires configured navigation before a resource panel action runs. */
export function requireResourcePanelHost(): ResourcePanelHost {
  if (!host) throw new Error("Resource panel host has not been configured");
  return host;
}
