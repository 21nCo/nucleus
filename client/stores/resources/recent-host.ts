import type { Resource } from "@nucleum/datafn/resource.enum";

/** Product resource selection supplied by the composing application. */
export interface RecentsHost {
  resources(): Resource[] | undefined;
}

let host: RecentsHost | undefined;

/** Installs live product resource selection before recent-record queries run. */
export function configureRecentsHost(value: RecentsHost) {
  host = value;
}

/** Requires explicit product composition when querying all recent resources. */
export function requireRecentsHost(): RecentsHost {
  if (!host) throw new Error("Recents host has not been configured");
  return host;
}
