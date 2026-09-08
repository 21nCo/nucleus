<script lang="ts">
  import { onMount } from "svelte";
  import * as pdfjs from "pdfjs-dist";
  import "@nucleum/features/memory/pdfAnnotator/pdfviewer.css";
  import context from "@nucleum/stores/context.store";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { fileEmbedChannel } from "@nucleum/stores/files/fileEmbedChannel.store";
  import { OperatingSystem } from "@nucleum/client/runtime/context.type";
  import { pdfCache } from "@21n/utils/pdfCache.utils";

  let {
    pdfViewer = $bindable(),
    pdfDocument = $bindable(),
    url,
    scale = $bindable(1),
    display_mode = "",
    style = "",
    children,
    onReady = undefined
  }: {
    pdfViewer?: any;
    pdfDocument?: any;
    url: string | URL;
    scale?: number;
    display_mode?: string;
    style?: string;
    children?: any;
    onReady?: (() => void) | undefined;
  } = $props();

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
  ).toString();

  const embed_message_id = generateSimpleRandomId();
  const MIN_SCALE = 0.5;
  const MAX_SCALE = 2.3;

  enum SpreadModes {
    NONE,
    ODD,
    EVEN
  }

  const pdfViewerL10n = {
    getLanguage() {
      return "en-us";
    },
    getDirection() {
      return "ltr";
    },
    async get(_ids: any[] | string, _args?: Object | null, fallback = "") {
      return fallback;
    },
    async translate(_element: HTMLElement) {},
    pause() {},
    resume() {}
  };

  let password = $state("");
  let passwordError = $state(false);
  let loadErrorMessage = $state<string | null>(null);
  let loadingProgress = $state(0);
  let isLoading = $state(false);
  let spreadMode = $state(resolveSpreadMode(display_mode));

  let container: HTMLDivElement;
  let dataViaEmbed: any;
  let pdfData: Uint8Array | undefined;
  let loadingTask: any = null;
  let fetchController: AbortController | null = null;
  let pageChangeHandler: ((event: any) => void) | null = null;
  let renderToken = 0;

  function resolveSpreadMode(mode: string) {
    if (mode in SpreadModes) {
      return SpreadModes[mode as keyof typeof SpreadModes];
    }

    return SpreadModes.NONE;
  }

  function resolveIsDataViaEmbed() {
    return $context.isEmbed && $context.os !== OperatingSystem.WINDOWS;
  }

  function resolveUrl() {
    return url.toString();
  }

  const abortOngoingFetch = () => {
    if (fetchController) {
      fetchController.abort();
      fetchController = null;
    }
  };

  const detachPageChangeListener = () => {
    if (pageChangeHandler && pdfViewer?.eventBus?.off) {
      pdfViewer.eventBus.off("pagechanging", pageChangeHandler);
      pageChangeHandler = null;
    }
  };

  const cleanupPdfResources = async () => {
    abortOngoingFetch();
    detachPageChangeListener();

    if (pdfViewer?.cleanup) {
      try {
        pdfViewer.cleanup();
      } catch {}
    }

    pdfViewer = undefined;

    const destroyers: Promise<unknown>[] = [];

    if (pdfDocument && typeof pdfDocument.destroy === "function") {
      destroyers.push(pdfDocument.destroy().catch(() => undefined));
    } else if (loadingTask && typeof loadingTask.destroy === "function") {
      destroyers.push(loadingTask.destroy().catch(() => undefined));
    }

    pdfDocument = undefined;

    if (destroyers.length > 0) {
      await Promise.allSettled(destroyers);
    }

    loadingTask = null;
    isLoading = false;
    loadingProgress = 0;
  };

  async function initialize() {
    if (resolveIsDataViaEmbed()) {
      try {
        dataViaEmbed = await fileEmbedChannel.fetch(resolveUrl(), embed_message_id);
      } catch {
        loadErrorMessage = "Error loading PDF. Please try again.";
        return;
      }
    }

    await renderDocument("onMount");
  }

  function onPasswordSubmit() {
    void renderDocument("onPasswordSubmit");
  }

  onMount(() => {
    void initialize();

    return () => {
      void cleanupPdfResources();
    };
  });

  const renderDocument = async (_from: string) => {
    const currentToken = ++renderToken;
    await cleanupPdfResources();
    passwordError = false;
    loadErrorMessage = null;

    const initPromise = import("pdfjs-dist/web/pdf_viewer.mjs").then(
      (pdfjsViewer) => {
        const eventBus = new pdfjsViewer.EventBus();
        const pdfLinkService = new pdfjsViewer.PDFLinkService({
          eventBus
        });
        const pdfFindController = new pdfjsViewer.PDFFindController({
          eventBus,
          linkService: pdfLinkService
        });
        const viewer = new pdfjsViewer.PDFViewer({
          container,
          eventBus,
          linkService: pdfLinkService,
          findController: pdfFindController,
          l10n: pdfViewerL10n
        });

        pdfLinkService.setViewer(viewer);

        return { viewer, pdfLinkService };
      }
    );

    const { viewer, pdfLinkService } = await initPromise;

    try {
      if (resolveIsDataViaEmbed()) {
        if (!dataViaEmbed) return;
        pdfData = fileEmbedChannel.base64ToUint8Array(dataViaEmbed);
      } else {
        const cachedData = await pdfCache.get(resolveUrl());

        if (cachedData) {
          pdfData = cachedData;
        } else {
          isLoading = true;
          loadingProgress = 0;
          fetchController = new AbortController();
          const response = await fetch(resolveUrl(), {
            signal: fetchController.signal
          });

          if (!response.ok) {
            throw new Error(
              `Failed to fetch PDF: ${response.status} ${response.statusText}`
            );
          }

          const contentType = response.headers.get("content-type") || "";
          if (!contentType.toLowerCase().includes("application/pdf")) {
            throw new Error("Fetched content is not a PDF");
          }

          const contentLength = response.headers.get("content-length");
          if (contentLength && response.body) {
            const total = parseInt(contentLength, 10);
            let loaded = 0;
            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              chunks.push(value);
              loaded += value.length;
              loadingProgress = Math.round((loaded / total) * 100);
            }

            const allChunks = new Uint8Array(loaded);
            let position = 0;
            for (const chunk of chunks) {
              allChunks.set(chunk, position);
              position += chunk.length;
            }

            pdfData = allChunks;
          } else {
            const arrayBuffer = await response.arrayBuffer();
            pdfData = new Uint8Array(arrayBuffer);
          }

          await pdfCache.set(resolveUrl(), pdfData);
          isLoading = false;
        }
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        isLoading = false;
        return;
      }

      console.error("Error loading PDF:", error);
      isLoading = false;
      loadErrorMessage = "Error loading PDF. Please try again.";
      return;
    } finally {
      fetchController = null;
    }

    if (!pdfData) return;

    loadingTask = pdfjs.getDocument({
      data: pdfData,
      password,
      isEvalSupported: false
    });

    try {
      const documentResult = await loadingTask.promise;

      if (currentToken !== renderToken) {
        await documentResult.destroy().catch(() => undefined);
        return viewer;
      }

      viewer.setDocument(documentResult);
      pdfLinkService.setDocument(documentResult, null);
      viewer.currentScale = scale;
      viewer.spreadMode = spreadMode;
      pdfDocument = documentResult;
      loadingTask = null;

      pageChangeHandler = () => {};
      viewer.eventBus.on("pagechanging", pageChangeHandler);
      pdfViewer = viewer;
      onReady?.();
    } catch (error: unknown) {
      const normalizedError =
        error instanceof Error ? error : new Error(String(error ?? ""));
      const name = normalizedError.name || normalizedError.toString();
      const message = normalizedError.message || String(error ?? "");
      const isPasswordError =
        typeof name === "string" && name.includes("Password");

      passwordError = isPasswordError;
      loadErrorMessage = message;
      await cleanupPdfResources();

      return viewer;
    }

    return viewer;
  };
</script>

<div class="relative w-full h-full" {style}>
  <div id="viewer-parent" class="w-full h-full">
    {#if loadErrorMessage}
      <div class="spdfinner">
        {#if passwordError}
          <p>This document requires a password to open:</p>
          <div>
            <input type="password" bind:value={password} />
            <button onclick={onPasswordSubmit} class="password-button">
              Submit
            </button>
          </div>
        {/if}
        <p>{loadErrorMessage}</p>
      </div>
    {:else}
      {#if isLoading}
        <div
          class="bg-bgs1 absolute inset-0 z-50 flex flex-col items-center justify-center w-full h-full gap-4"
        >
          <div class="text-fg1 text-sm">Loading PDF...</div>
          <div class="text-fg2 text-xs">{loadingProgress}%</div>
        </div>
      {/if}
      <div id="viewerContainer" bind:this={container}>
        <div id="viewer" class="pdfViewer"></div>
        {@render children?.()}
      </div>
    {/if}
  </div>
</div>
