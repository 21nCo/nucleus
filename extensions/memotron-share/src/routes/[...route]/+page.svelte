<script lang="ts">
  import { onMount } from "svelte";
  import ShareContentSaver from "@nucleum/features/memory/capture/ShareContentSaver.svelte";
  import { NodeType } from "@nucleum/features/memory/node/node.type";
  import type { IPasteCaptureData } from "@nucleum/features/memory/capture/capture.type";
  import { sanitizeAndResolve } from "@nucleum/features/memory/node/url.utils";
  import { logger } from "@nucleum/components/debug/logger.client";
  import SheetDebugLogs from "@nucleum/extensions/SheetDebugLogs.svelte";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { resolveContentTypeForFile } from "@nucleum/features/memory/capture/capture.utils";

  let data: IPasteCaptureData | undefined = undefined;
  let nodeType: NodeType | undefined = undefined;
  let error: string | undefined = undefined;
  let isOffline: boolean = false;
  let debugLog: string[] = [];
  const dev_isShowDragToClosePill = true;
  const dev_isDebug = false;
  const source =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("source")
      : null;
  const unsupportedStandaloneNodeTypes = new Set([
    NodeType.SIMPLE_TEXT,
    NodeType.CODE,
    NodeType.FILE,
    NodeType.UNKNOWN
  ]);

  async function handleMessageFromParent(event: any) {
    try {
      if (event?.data?.type === "SWIFT_MESSAGE") {
        addToDebugLog("Received message from parent");
        if (event?.data?.payload) {
          const parsed = JSON.parse(event.data.payload);
          addToDebugLog(`Parsed data: ${JSON.stringify(parsed)}`);
          if (parsed.type === "SHARED_CONTENT") {
            if (data) return;
            await processShareData(parsed);
          }
        }
      }
    } catch (e: any) {
      addToDebugLog(`Error: ${e.message}`);
      error = "Failed to process shared content";
    }
  }

  async function processShareData(shareData: any) {
    resetShareState();
    try {
      if (shareData.source !== "share_extension") {
        error = "Invalid source";
        return;
      }
      if (
        shareData.url?.startsWith("https:") ||
        shareData.text?.startsWith("https:")
      ) {
        {
          const url = shareData.url?.startsWith("https:")
            ? shareData.url
            : shareData.text;
          const result = sanitizeAndResolve(url);
          if (typeof result === "string") {
            data = {
              text: result,
              contentType: NodeType.SIMPLE_TEXT
            };
            nodeType = NodeType.SIMPLE_TEXT;
          } else {
            data = {
              text: result.url,
              contentType: result.contentType,
              textMetadata: {
                isUrl: true,
                isEmbed: result.isEmbed
              }
            };
            nodeType = result.contentType;
          }
        }
      } else if (shareData.imageData) {
        const imageType = shareData.imageType?.toLowerCase();
        const mimeType = imageType
          ? imageType.startsWith("image/")
            ? imageType
            : `image/${imageType}`
          : "image/png";
        const blob = await fetch(
          `data:${mimeType};base64,${shareData.imageData}`
        ).then((r) => r.blob());
        const file = new File(
          [blob],
          resolveFileName(shareData.name, mimeType, undefined, "shared-image"),
          { type: mimeType }
        );
        if (!applyFileToCapture(file)) return;
      } else if (shareData.file && shareData.file.mimeType !== "text/plain") {
        addToDebugLog(`File: mimeType: ${shareData.file.mimeType}`);
        addToDebugLog(`File: name: ${shareData.file.name}`);
        addToDebugLog(`File: size: ${shareData.file.size}`);
        addToDebugLog(`File: type: ${shareData.file.type}`);
        addToDebugLog(`File: url: ${shareData.file.url}`);
        addToDebugLog(`File: typeIdentifier: ${shareData.file.typeIdentifier}`);
        const base64 = shareData.file.data;
        const mimeType = resolveMimeType(shareData.file);
        if (!base64 && !shareData.file.url) {
          error = "Invalid file payload";
          return;
        }
        let blob: Blob | undefined = undefined;
        if (base64) {
          blob = await fetch(`data:${mimeType};base64,${base64}`).then((r) =>
            r.blob()
          );
        } else if (shareData.file.url) {
          try {
            blob = await fetch(shareData.file.url).then((r) => r.blob());
          } catch (fetchError: any) {
            addToDebugLog(`File fetch error: ${fetchError.message}`);
          }
        }
        if (!blob) {
          error = "Invalid file payload";
          return;
        }
        const file = new File(
          [blob],
          resolveFileName(
            shareData.file.name,
            mimeType,
            shareData.file.typeIdentifier,
            "shared-file"
          ),
          { type: mimeType }
        );
        if (!applyFileToCapture(file)) return;
      } else if (shareData.text) {
        data = {
          text: shareData.text,
          contentType: NodeType.SIMPLE_TEXT
        };
        nodeType = NodeType.SIMPLE_TEXT;
      } else {
        error = "No valid content found";
      }
    } catch (e: any) {
      addToDebugLog(`Process error: ${e.message}`);
      error = "Failed to process shared content";
    }
  }

  function applyFileToCapture(file: File) {
    const resolvedType = resolveContentTypeForFile(file);
    addToDebugLog(`Resolved node type: ${resolvedType}`);
    if (!resolvedType || unsupportedStandaloneNodeTypes.has(resolvedType)) {
      error = "File type not supported";
      return false;
    }
    data = {
      file,
      contentType: resolvedType
    };
    nodeType = resolvedType;
    return true;
  }

  function resolveMimeType(filePayload: any) {
    const rawMime = filePayload?.mimeType ?? filePayload?.type;
    if (rawMime) return rawMime;
    if (filePayload?.typeIdentifier?.includes("pdf")) return "application/pdf";
    if (filePayload?.typeIdentifier?.includes("png")) return "image/png";
    if (
      filePayload?.typeIdentifier?.includes("jpeg") ||
      filePayload?.typeIdentifier?.includes("jpg")
    )
      return "image/jpeg";
    return "application/octet-stream";
  }

  function resolveFileName(
    name: string | undefined,
    mimeType?: string,
    typeIdentifier?: string,
    fallback: string = "shared-content"
  ) {
    const cleaned = name && name.trim().length > 0 ? name.trim() : fallback;
    if (/\.[A-Za-z0-9]+$/.test(cleaned)) return cleaned;
    const extension = resolveExtension(mimeType, typeIdentifier);
    return extension ? `${cleaned}.${extension}` : cleaned;
  }

  function resolveExtension(mimeType?: string, typeIdentifier?: string) {
    if (mimeType) {
      const normalized = mimeType.toLowerCase();
      const explicit: Record<string, string> = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/gif": "gif",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/x-wav": "wav",
        "audio/wav": "wav",
        "video/quicktime": "mov",
        "text/markdown": "md",
        "application/pdf": "pdf"
      };
      if (explicit[normalized]) return explicit[normalized];
      const [, subtype] = normalized.split("/");
      if (subtype) return subtype;
    }
    if (typeIdentifier) {
      const lower = typeIdentifier.toLowerCase();
      if (lower.includes("pdf")) return "pdf";
      if (lower.includes("png")) return "png";
      if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";
      if (lower.includes("heic")) return "heic";
      if (lower.includes("markdown")) return "md";
    }
    return undefined;
  }

  function resetShareState() {
    data = undefined;
    nodeType = undefined;
    error = undefined;
  }

  onMount(async () => {
    addToDebugLog("share page mounted");
    // testRun();
  });

  function testRun() {
    data = {
      text: "Some normal text",
      contentType: NodeType.SIMPLE_TEXT,
      textMetadata: {
        isUrl: true,
        isEmbed: false
      }
    };
    nodeType = NodeType.SIMPLE_TEXT;
  }

  function addToDebugLog(log: string) {
    debugLog = [...debugLog, log];
    logger.log({ at: "memotron-share", log });
  }

  function handleSaved() {
    addToDebugLog("Content saved");
  }

  function handleOpen(payload: { nodeId: string | undefined }) {
    addToDebugLog(`Open node: ${payload.nodeId}`);
  }

  function handleClose() {
    addToDebugLog("Close");
  }
</script>

<div
  class="w-full h-full flex flex-col gap-2 bg-bgs1 text-base text-fgs1 overflow-y-auto"
>
  {#if dev_isShowDragToClosePill}
    <div class="flex w-full py-3 justify-center items-center">
      <div class="h-1.5 w-16 bg-bgs3 rounded-full" />
    </div>
  {/if}
  <SheetDebugLogs logs={debugLog} isShowLogs={dev_isDebug}>
    Source: {source}
    <br />
    nodeType: {nodeType}
    {#if error}
      <br />
      error: {error}
    {/if}
  </SheetDebugLogs>
  {#if !dev_isDebug}
    <div class="flex-1 min-h-0 flex-grow">
      {#if error}
        <div class="flex items-center justify-center h-full">
          <span class="text-ars1">{error}</span>
        </div>
      {:else if data}
        <ShareContentSaver
          {data}
          {nodeType}
          {error}
          {isOffline}
          onSaved={handleSaved}
          onOpen={handleOpen}
          onClose={handleClose}
        />
      {:else}
        <EmptyStatusView
          isLoadingState={true}
          loadingText="Logged in. Reading data..."
        />
      {/if}
    </div>
  {/if}
</div>
<svelte:window onmessage={handleMessageFromParent} />
