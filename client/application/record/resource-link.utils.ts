import { copyToClipboard } from "@21n/utils/utils";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";

function resolveLinkForResource(resource: string) {
  return (
    "http://" +
    (import.meta.env?.VITE_HOST ?? window.location.host) +
    "/?full=" +
    resource
  );
}

export function copyResourceLinkToClipboard(id: IRecordId) {
  const link = resolveLinkForResource(id.toString());
  copyToClipboard(link);
}
