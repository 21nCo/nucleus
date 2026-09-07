import { Resource } from "@nucleum/datafn/resource.enum";
import type { NodeType } from "@nucleum/features/memory/node/node.type";

import { copyToClipboard } from "@21n/utils/utils";
import { enumToCamelCase } from "@21n/shared-utils/text.utils";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import type { IRecordId } from "@21n/types/data.type";

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

/**
 * Generates a node id using the externalId and type.
 * @param externalId
 * @param type NodeType
 * @returns
 */
export function generateSyncedResourceId(externalId: string, type: NodeType) {
  return generateResourceId(Resource.node, {
    prefix: enumToCamelCase(type),
    id: externalId
  });
}

/**
 * Creates a seprate thread for taco functions to avoid blocking the main thread.
 */
// export const tacoWorker = new Worker(
//   new URL("$lib/client/products/memotron/taco/taco.worker.ts", import.meta.url),
//   { type: "module" }
// );
export const tacoWorker: Pick<Worker, "postMessage" | "onmessage"> = {
  postMessage: () => {},
  onmessage: null
};

export function resolveFileUploadErrorMessage(
  errors: { file: File; type: string }[],
  params?: {
    maxFileSizeMB?: number;
  }
) {
  let error = "";
  errors.forEach((err) => {
    error = (error ? error + ", " : "") + resolveErroLabel(err.file, err.type);
  });
  return error;

  function resolveErroLabel(file: File, type: string) {
    let error = "";
    if (type === "type") {
      const extension = file.name.split(".").pop();
      error = `File type .${extension} not supported`;
    } else if (type === "size") {
      error = `File size exceeds the maximum limit of ${
        params?.maxFileSizeMB
      }MB`;
    }
    return error;
  }
}

/**
 * Sort the search results proritizing label search results over body search results.
 * @param a
 * @param b
 * @returns
 */
export const searchSort = (a: any, b: any) => {
  const aLabel = a.labelSearch ?? "";
  const bLabel = b.labelSearch ?? "";

  const aContainsHighlight = aLabel.includes("**");
  const bContainsHighlight = bLabel.includes("**");

  if (aContainsHighlight && !bContainsHighlight) {
    return -1;
  }
  if (!aContainsHighlight && bContainsHighlight) {
    return 1;
  }

  if (aLabel === "" && bLabel !== "") {
    return 1;
  }
  if (aLabel !== "" && bLabel === "") {
    return -1;
  }
  return aLabel.localeCompare(bLabel);
};

export const highlightSearchQuery = (items: any[], searchQuery: string) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return items.map((item) => {
    const aLabel = (item.label ?? "").toLowerCase();
    const aText = (item.text ?? "").toLowerCase();

    let labelSearch = undefined;
    let bodySearch = undefined;

    if (aLabel.includes(normalizedQuery)) {
      labelSearch = item.label.replace(
        new RegExp(`(${searchQuery})`, "gi"),
        "**$1**"
      );
    }

    if (aText.includes(normalizedQuery)) {
      const matchIndex = aText.indexOf(normalizedQuery);
      const preContextLength = 50;
      const postContextLength = 100;
      if (item.text.length <= preContextLength * 2 + searchQuery.length) {
        bodySearch = item.text
          .replace(/\(resource=[^)]+\)/g, "")
          .replace(/[\r\n\s]+/g, " ")
          .trim()
          .replace(new RegExp(`(${searchQuery})`, "gi"), "**$1**");
      } else {
        const startIndex = Math.max(0, matchIndex - preContextLength);
        const endIndex = Math.min(
          item.text.length,
          matchIndex + searchQuery.length + postContextLength
        );

        let truncatedText = item.text
          .slice(startIndex, endIndex)
          .replace(/\(resource=[^)]+\)/g, "")
          .replace(/[\r\n\s]+/g, " ")
          .trim();

        if (startIndex > 0) truncatedText = "..." + truncatedText;
        if (endIndex < item.text.length) truncatedText = truncatedText + "...";

        bodySearch = truncatedText.replace(
          new RegExp(`(${searchQuery})`, "gi"),
          "**$1**"
        );
      }
    }

    return {
      ...item,
      labelSearch,
      bodySearch
    };
  });
};
