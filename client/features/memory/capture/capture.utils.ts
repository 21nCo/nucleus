import { logger } from "@nucleum/client/runtime/logging/logger";
import { parse } from "@21n/shared-utils/json.utils";
import { textIsCode } from "@21n/shared-utils/text.utils";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
import { sanitizeAndResolve } from "@nucleum/features/memory/node/url.utils";
import type { IMultiFileCaptureData, IPasteCaptureData } from "@nucleum/features/memory/capture/capture.type";

export function resolveContentTypeForFile(file: File) {
  let nodeType: NodeType | undefined = undefined;
  if (file.type.includes("image/")) {
    nodeType = NodeType.IMAGE;
  } else if (file.type.includes("video/")) {
    nodeType = NodeType.VIDEO;
  } else if (file.type.includes("audio/")) {
    nodeType = NodeType.AUDIO;
  } else if (file.type.includes("application/pdf")) {
    nodeType = NodeType.PDF;
  } else if (file.type.includes("markdown")) {
    nodeType = NodeType.NODULAR_MARKDOWN;
  } else {
    nodeType = NodeType.FILE;
  }
  return nodeType;
}

export function resolveMultipleFilesData(
  files: File[],
  maxSizeInMb: number
): IMultiFileCaptureData {
  let totalFilesCount = files.length;
  let filesWithType = files.map((file) => {
    return {
      file,
      contentType: resolveContentTypeForFile(file)
    };
  });
  let sizeExceededCount = filesWithType.filter(
    (file) => file.file.size > maxSizeInMb * 1024 * 1024
  ).length;
  return {
    files: filesWithType.filter((file) => file.contentType !== undefined),
    totalCount: totalFilesCount,
    sizeExceededCount
  };
}

export async function resolvePasteContents(
  event: ClipboardEvent,
  params: {
    maxFileSizeInMb: number;
  }
): Promise<IPasteCaptureData | undefined> {
  const items = event?.clipboardData?.items;
  if (!items) return;
  const itemArray = Array.from(items);
  logger.log({
    at: "handlePaste",
    items,
    length: items?.length,
    types: itemArray.map((i) => i.type)
  });
  // const allTexts = await Promise.all(
  //   itemArray.map((i) => getAsStringPromise(i))
  // );
  // console.log("allTexts", allTexts);
  const isAllFiles =
    items.length > 1 && itemArray.every((i) => !i.type.includes("text"));
  const files = event?.clipboardData?.files;
  if (files && files.length > 0) {
    if (!files) return;
    let allFiles = Array.from(files);
    const multipleFilesData = resolveMultipleFilesData(
      allFiles,
      params.maxFileSizeInMb
    );
    if (
      files.length === 1 &&
      multipleFilesData &&
      multipleFilesData.sizeExceededCount === 1
    ) {
      return {
        error: `File size exceeds the maximum limit of ${params.maxFileSizeInMb} MB.`
      };
    } else if (multipleFilesData && multipleFilesData.sizeExceededCount > 1) {
      return {
        error: `${multipleFilesData.sizeExceededCount} files exceed the maximum size of ${params.maxFileSizeInMb} MB.`
      };
    }
    if (files.length === 1) {
      const fileData = multipleFilesData.files[0];
      return {
        file: fileData.file,
        contentType: fileData.contentType
      };
    }
    return {
      multipleFiles: multipleFilesData
    };
  }

  const text = event?.clipboardData?.getData("text");
  if (!text) return;
  const sanitized = sanitizeAndResolve(text);
  let isCodeText = itemArray.some((i) => i.type === "vscode-editor-data");
  if (!isCodeText && typeof sanitized === "string") {
    isCodeText = textIsCode(sanitized);
  }
  if (isCodeText && typeof sanitized === "string") {
    const [text, metadataString] = await Promise.all([
      getAsStringPromise(itemArray.find((i) => i.type === "text/plain")),
      getAsStringPromise(itemArray.find((i) => i.type === "vscode-editor-data"))
    ]);
    let metadata;
    try {
      metadata = metadataString ? parse(metadataString) : null;
    } catch (e) {
      metadata = null;
    }

    return {
      contentType: NodeType.CODE,
      text: sanitized,
      textMetadata: { codeLanguage: metadata?.mode }
    };
  }

  if (typeof sanitized === "object") {
    return {
      contentType: sanitized.contentType,
      text: sanitized.url,
      textMetadata: {
        isUrl: true,
        isEmbed: sanitized.isEmbed
      }
    };
  }
  const isMdText = itemArray.some(
    (i) => i.type === "text/markdown" || i.type.includes("notion")
  );
  const spans = sanitized.split("\n");

  if (spans.length > 1) {
    return {
      text: sanitized,
      textMetadata: {
        isMultiBlockText: true,
        isMarkdown: isMdText
      }
    };
  }

  return {
    text: sanitized,
    textMetadata: {
      isMarkdown: isMdText
    }
  };

  function getAsStringPromise(item?: DataTransferItem): Promise<string> {
    return new Promise((resolve) => {
      if (!item) {
        resolve("");
        return;
      }
      item.getAsString((value) => resolve(value));
    });
  }
}
