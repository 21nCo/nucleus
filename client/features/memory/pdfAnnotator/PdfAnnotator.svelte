<script lang="ts">
  import PdfViewer from "@nucleum/features/memory/pdfAnnotator/PdfViewer.svelte";
  import {
    AnnotationType,
    type Coords,
    type LTWH,
    type LTWHP,
    type ScaledPosition
  } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import {
    asElement,
    embedAnnotationsandDownload,
    getBoundingRect,
    getBoundingRectSE,
    getClientRects,
    getPagesFromRange,
    isHTMLElement,
    PdfHandler,
    viewportToScaled
  } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.utils";
  import { debouncer } from "@21n/utils/utils";
  import { mount, onDestroy, onMount, unmount } from "svelte";
  import TextHiglighter from "@nucleum/features/memory/pdfAnnotator/TextHiglighter.svelte";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import InlineToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/InlineToolBar.svelte";
  import Comment from "@nucleum/features/memory/pdfAnnotator/comment/Comment.svelte";
  import InlineEditToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/InlineEditToolBar.svelte";
  import CommentEditor from "@nucleum/features/memory/pdfAnnotator/comment/CommentEditor.svelte";
  import ToolBar from "@nucleum/features/memory/pdfAnnotator/toolbar/ToolBar.svelte";
  import { FindState } from "pdfjs-dist/web/pdf_viewer.mjs";
  import { Size } from "@21n/elements/size.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import SwitchInput from "@21n/elements/toggle/SwitchInput.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import type { IHighlighter } from "@nucleum/features/memory/common/highlighters/highlight.type";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import context from "@nucleum/stores/context.store";
  import { Embed, OperatingSystem } from "@nucleum/client/runtime/context.type";
  import { fileStore } from "@nucleum/stores/files/file.store";
  import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
  import { fileEmbedChannel } from "@nucleum/stores/files/fileEmbedChannel.store";
  import { fly } from "svelte/transition";
  import type { IPdfBookmarkBody } from "@nucleum/features/memory/node/node.type";

  let {
    url,
    node,
    annots: initialAnnots = [],
    accessPoint = ResourceAccessPoint.SELF,
    onAnnotation = undefined,
    onConfigUpdate = undefined
  }: {
    url: string;
    node: any;
    annots?: IPdfBookmarkBody[];
    accessPoint?: ResourceAccessPoint;
    onAnnotation?: ((annotations: IPdfBookmarkBody[]) => void) | undefined;
    onConfigUpdate?:
      | ((detail: { config: { pdfScale: number; pdfPage: number } }) => void)
      | undefined;
  } = $props();

  const pdfPersistence = $derived(
    node?.id ? new PdfHandler(node.id) : undefined
  );
  const dev_isEnableDownloadAnnotatedPdf = false;
  const DPR = window.devicePixelRatio;
  const MIN_SCALE = $context.os == OperatingSystem.WINDOWS ? 0.5 : 0.1;
  const MAX_SCALE = $context.os == OperatingSystem.WINDOWS ? 2.3 : 1.8;

  function resolveDefaultScale() {
    return $context.os == OperatingSystem.WINDOWS
      ? 1
      : $context.os == OperatingSystem.IOS && $context.embed === Embed.HANDSET
        ? 0.15
        : $context.os == OperatingSystem.IOS && $context.embed === Embed.TABLET
          ? 0.3
          : 0.5;
  }

  let annots = $state<IPdfBookmarkBody[]>([]);
  let shapeVisible = $state(false);
  let scale = $state(resolveDefaultScale());
  let pageNumber = $state(1);
  let annotationMode = $state<AnnotationType>(AnnotationType.NONE);
  let isSearchActive = $state(false);
  let searchText = $state("");
  let searchCaseSensitive = $state(false);
  let searchHighlightAll = $state(true);
  let inlineToolBarVisible = $state(false);
  let isInlineEditBarVisible = $state(false);
  let commentEditorVisible = $state(false);
  let popupStyle = $state("");
  let pdfViewer = $state<any>(undefined);
  let annotation = $state<any>({});
  let annotClickedId = $state("");
  let annotClickedColor = $state("");
  let annotCickedType = $state("");
  let selectedColor = $state($highlightStore.highlighters[0].id);
  let annotClickedComment = $state("");
  let clickBoundingRect = $state<LTWH | null>(null);
  let pdfDocument = $state<any>(undefined);

  let containerBoundingRect: DOMRect | null = null;
  let container: HTMLElement;
  let start: Coords | null;
  let locked = false;
  let end: Coords | null;
  let startPageNumber: number | undefined;
  let endPageNumber: number | undefined;
  let viewerContainerElement: HTMLElement;
  let scrollTop = 0;
  let removeAllRanges: any;
  let eventBusViewer: any = null;
  let textLayerRenderedHandler: (() => void) | null = null;
  let findControlStateHandler: ((data: any) => void) | null = null;
  let ranOnce = false;
  let mainRects: any = [];
  let onViewerMouseDown: ((event: MouseEvent) => void) | null = null;

  const highlightLayerComponents = new Map<
    HTMLElement,
    Record<string, any>[]
  >();

  $effect(() => {
    annots = initialAnnots;
  });

  function resolveKeyboardKey(event: KeyboardEvent | CustomEvent) {
    if (event instanceof KeyboardEvent) return event.key;
    const detail = event.detail;
    if (detail instanceof KeyboardEvent) return detail.key;
    if (
      detail &&
      typeof detail === "object" &&
      "key" in detail &&
      typeof detail.key === "string"
    ) {
      return detail.key;
    }
    return undefined;
  }

  function resolveArrayBuffer(buffer: ArrayBufferLike) {
    return Uint8Array.from(new Uint8Array(buffer)).buffer;
  }

  function resolveSearchParams() {
    return {
      query: searchText,
      caseSensitive: searchCaseSensitive,
      entireWord: false,
      highlightAll: searchHighlightAll,
      findPrevious: false
    };
  }

  function onInlineAnnotate(nextAnnotationMode: AnnotationType) {
    if (
      nextAnnotationMode == AnnotationType.COMMENT ||
      nextAnnotationMode == AnnotationType.TASK
    ) {
      annotCickedType = nextAnnotationMode;
      commentEditorVisible = true;
    } else {
      annotate({ detail: nextAnnotationMode });
    }
    inlineToolBarVisible = false;
  }

  function viewportPositionToScaled({
    pageNumber,
    boundingRect,
    rects
  }: any): ScaledPosition {
    const viewport = pdfViewer?.getPageView(pageNumber - 1)?.viewport;

    return {
      boundingRect: viewportToScaled(boundingRect, viewport),
      rects: (rects || []).map((rect: any) =>
        rect.map((rec: any) => viewportToScaled(rec, viewport))
      ),
      pageNumber
    };
  }

  function falseAll() {
    inlineToolBarVisible = false;
    isInlineEditBarVisible = false;
    commentEditorVisible = false;
  }

  function selectionChangeHandler(selection: any) {
    const range: Range | null =
      selection?.rangeCount || 0 > 0 ? selection?.getRangeAt(0) : null;
    if (selection.isCollapsed || !range) return;

    const pages = getPagesFromRange(range);
    if (!pages || pages.length === 0) return;

    const rects = getClientRects(range, pages, scale);
    if (rects.length === 0) return;

    const selectedText = selection.toString();
    const boundingRect = getBoundingRect(rects[pages[0].number - 1]);
    const viewportPosition: any = {
      boundingRect,
      rects,
      pageNumber: pages[0].number
    };

    annotation = viewportPositionToScaled(viewportPosition);
    annotation.selectedText = selectedText;
    removeAllRanges = () => {
      selection.removeAllRanges();
    };
    falseAll();
    annotClickedComment = "";
    popupStyle = `position: fixed; top: ${end?.y}px; left: ${end?.x}px;z-index: 2000;`;

    if (annotationMode !== AnnotationType.NONE) {
      if (
        annotationMode === AnnotationType.COMMENT ||
        annotationMode === AnnotationType.TASK
      ) {
        commentEditorVisible = true;
      } else {
        annotate({ detail: annotationMode });
      }
    } else {
      inlineToolBarVisible = true;
    }
  }

  async function annotate(event: any, editorValues: any = {}) {
    if (!pdfPersistence) return;
    const annotationToPersist = $state.snapshot(annotation);
    annotationToPersist.annotType = event.detail;

    if (
      event.detail === AnnotationType.COMMENT ||
      event.detail === AnnotationType.TASK
    ) {
      annotationToPersist.comment = editorValues.comment;
      if (editorValues.dueDate) {
        annotationToPersist.due = {};
        annotationToPersist.due.date = new Date(
          editorValues.dueDate
        ).toLocaleDateString("en-CA");
        annotationToPersist.due.completed = false;
      }
    }

    annotationToPersist.color = selectedColor;
    annotationToPersist.date = new Date().toLocaleDateString("en-CA");
    annotationToPersist.startPageNumber =
      startPageNumber ?? annotationToPersist.pageNumber;
    annotationToPersist.endPageNumber =
      endPageNumber ?? annotationToPersist.pageNumber;
    await pdfPersistence.saveClip(annotationToPersist);
    await refreshAnnotations();
    renderHighlightLayers();
    removeAllRanges?.();
    annotation = {};
  }

  function handleAnnotClick(id: string) {
    const elements = document.getElementsByClassName(id);
    const element = elements[0] as HTMLElement | undefined;
    annotClickedId = id;
    annotClickedColor = element?.dataset?.highlighter || "";
    annotCickedType = element?.dataset?.annottype || "";
    if (
      annotCickedType == AnnotationType.COMMENT ||
      annotCickedType == AnnotationType.TASK
    ) {
      annotClickedComment = element?.dataset?.comment || "";
    }

    commentEditorVisible = false;
    inlineToolBarVisible = false;
    isInlineEditBarVisible = false;
    popupStyle = `position: fixed; top: ${end?.y}px; left: ${end?.x}px;z-index: 1000;`;
    isInlineEditBarVisible = true;
  }

  async function findOrCreateHighlightLayer(page: number) {
    const { textLayer } = pdfViewer.getPageView(page - 1) || {};
    if (!textLayer) {
      return "LayerCannotBeCreated";
    }

    mainRects = annots?.filter(
      (highlight) =>
        (highlight.rects && highlight.rects[page - 1] != undefined) ||
        (highlight.rect && highlight.pageNumber == page)
    );
    if (!mainRects) return;

    let highlightsContainer = textLayer.div.querySelector(
      ".Pdf-Highlighter-Container"
    ) as HTMLElement | null;

    if (highlightsContainer) {
      removeHighlightLayerComponents(highlightsContainer);
      textLayer.div.removeChild(highlightsContainer);
    }

    highlightsContainer = document.createElement("div");
    highlightsContainer.classList.add("Pdf-Highlighter-Container");
    highlightsContainer.style =
      "-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;";
    textLayer.div.appendChild(highlightsContainer);
    highlightLayerComponents.set(highlightsContainer, []);

    mainRects?.forEach((highlight: any) => {
      let modifiedRects;
      let modifiedRect;

      if (highlight.rects) {
        modifiedRects = highlight?.rects[page - 1]?.map((rect: any) =>
          scaleValues(rect)
        );
      } else if (highlight.rect) {
        modifiedRect = scaleValues(highlight.rect);
      }

      if (
        highlight.annotType == AnnotationType.COMMENT ||
        highlight.annotType == AnnotationType.TASK
      ) {
        const component = mount(Comment, {
          target: highlightsContainer,
          props: {
            rects: modifiedRects,
            rect: modifiedRect,
            annotType: highlight.annotType,
            id: highlight.id,
            highlighter: highlight.color,
            comment: highlight.comment,
            pageRectTop: highlight?.rect?.pageRectTop,
            showIcon:
              (highlight.rects && highlight.rects[page - 2] == undefined) ||
              highlight.rect,
            onClick: handleAnnotClick
          }
        });
        highlightLayerComponents.get(highlightsContainer)?.push(component);
      } else if (highlight.annotType !== "SHAPE") {
        const component = mount(TextHiglighter, {
          target: highlightsContainer,
          props: {
            rects: modifiedRects,
            annotType: highlight.annotType,
            id: highlight.id,
            highlighter: highlight.color,
            onClick: handleAnnotClick
          }
        });
        highlightLayerComponents.get(highlightsContainer)?.push(component);
      }
    });

    mainRects = [];
    return "LayerCreated";
  }

  export function scrollToAnnot(id: string, targetPageNumber: Number) {
    pdfViewer.scrollPageIntoView({
      pageNumber: targetPageNumber
    });
    handleScroll("");
    setTimeout(() => {
      const annotItems = document.querySelectorAll<HTMLElement>("." + id);
      const top =
        (annotItems[0]?.offsetTop || 0) +
        (viewerContainerElement?.scrollTop || 0) -
        100;
      viewerContainerElement?.scrollTo({
        top,
        left: 0,
        behavior: "smooth"
      });
      annotItems.forEach((item) => {
        const style = window.getComputedStyle(item);
        const backgroundColor = style.backgroundColor;
        const opacity = style.opacity;
        item.style.backgroundColor = "hotpink";
        item.style.opacity = "0.6";
        setTimeout(() => {
          item.style.backgroundColor = backgroundColor;
          item.style.opacity = opacity;
        }, 2000);
      });
    }, 500);
  }

  function renderHighlightLayers() {
    if (!ranOnce) {
      const scaleFactor =
        pdfViewer.viewer?.style?.getPropertyValue("--scale-factor");
      if (pdfViewer.viewer) {
        pdfViewer.viewer.style.setProperty("--scale-factor", scaleFactor * DPR);
      }
      ranOnce = true;
    }

    scale = pdfViewer.currentScale;

    for (let page = 1; page <= pdfDocument.numPages; page++) {
      findOrCreateHighlightLayer(page);
    }
  }

  function scaleValues({ x1, y1, x2, y2, height, width }: any) {
    x1 *= scale * DPR;
    y1 *= scale * DPR;
    x2 *= scale * DPR;
    y2 *= scale * DPR;
    height *= scale * DPR;
    width *= scale * DPR;

    return { x1, y1, x2, y2, height, width };
  }

  async function handleAnnotDelete(_event?: any, id?: string) {
    if (!pdfPersistence) return;
    const deleteAnnot = id || annotClickedId;
    await pdfPersistence.deleteClip(deleteAnnot);
    annotClickedComment = "";
    await refreshAnnotations();
    renderHighlightLayers();
    isInlineEditBarVisible = false;
  }

  async function handleColorChange(highlighter: IHighlighter) {
    if (!pdfPersistence) return;
    const selectedAnnotation = annots.find(
      (annot: any) => annot.id === annotClickedId
    );
    if (!selectedAnnotation) return;

    selectedAnnotation.color = highlighter.id;
    await pdfPersistence.updateClip(annotClickedId, {
      ...selectedAnnotation,
      color: highlighter.id
    });
    selectedColor = highlighter.id;
    await refreshAnnotations();
    renderHighlightLayers();
    isInlineEditBarVisible = false;
  }

  async function handleUpdateComment(comment: string) {
    if (!pdfPersistence) return;
    const selectedAnnotation = annots.find(
      (annot: any) => annot.id === annotClickedId
    );
    if (!selectedAnnotation) return;

    selectedAnnotation.comment = comment;
    await pdfPersistence.updateClip(annotClickedId, {
      ...selectedAnnotation,
      comment
    });
    annotClickedComment = "";
    await refreshAnnotations();
    renderHighlightLayers();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      falseAll();
      annotClickedComment = "";
      annotation = {};
      removeAllRanges?.();
    }
  }

  function onSearch() {
    const searchParams = resolveSearchParams();
    pdfViewer.eventBus.dispatch("find", {
      source: "searchFunctionality",
      type: "find",
      ...searchParams
    });
  }

  function findNext() {
    const searchParams = {
      ...resolveSearchParams(),
      findPrevious: false
    };
    pdfViewer.eventBus.dispatch("find", {
      source: "searchFunctionality",
      type: "again",
      ...searchParams
    });
  }

  function findPrevious() {
    const searchParams = {
      ...resolveSearchParams(),
      findPrevious: true
    };
    pdfViewer.eventBus.dispatch("find", {
      source: "searchFunctionality",
      type: "again",
      ...searchParams
    });
  }

  function resetSearch() {
    const clearParams = {
      ...resolveSearchParams(),
      query: "",
      highlightAll: false,
      findPrevious: false
    };
    searchText = "";
    if (pdfViewer?.eventBus) {
      pdfViewer.eventBus.dispatch("find", {
        source: "searchFunctionality",
        type: "find",
        ...clearParams
      });
    }
  }

  function handleSearchToggle(isActive: boolean) {
    isSearchActive = isActive;
    if (!isActive) {
      resetSearch();
    }
  }

  function handlePageNavigation(targetPage: number) {
    if (!pdfViewer) return;

    const clampedPage = Math.min(
      Math.max(targetPage, 1),
      pdfViewer.pagesCount || 1
    );

    pageNumber = clampedPage;
    if (pdfViewer.currentPageNumber !== clampedPage) {
      pdfViewer.currentPageNumber = clampedPage;
    }

    const linkService = pdfViewer.linkService ?? pdfViewer._linkService;
    if (linkService?.goToPage) {
      linkService.goToPage(clampedPage);
    } else if (pdfViewer.scrollPageIntoView) {
      pdfViewer.scrollPageIntoView({ pageNumber: clampedPage });
    }
  }

  function updateScaleFactor() {
    const scaleFactor =
      pdfViewer.viewer.style.getPropertyValue("--scale-factor");
    pdfViewer.viewer.style.setProperty("--scale-factor", scaleFactor * DPR);
  }

  async function handleRenderOptions(option: string) {
    if (option === "ZOOMIN") {
      if (scale <= MAX_SCALE) {
        scale = scale + 0.1;
        pdfViewer.currentScale = scale;
        updateScaleFactor();
        await persistPdfState();
      }
    } else if (option === "ZOOMOUT") {
      if (scale >= MIN_SCALE) {
        scale = scale - 0.1;
        pdfViewer.currentScale = scale;
        updateScaleFactor();
        await persistPdfState();
      }
    }
  }

  async function persistPdfState() {
    if (!node?.id) return;
    onConfigUpdate?.({
      config: {
        pdfScale: scale,
        pdfPage: pageNumber
      }
    });
  }

  const debouncedPersistPdfState = debouncer(async () => {
    await persistPdfState();
  }, 1000);

  function handleScroll(event: any) {
    pageNumber = pdfViewer.currentPageNumber;
    scrollTop = event?.target?.scrollTop || scrollTop;
    debouncedPersistPdfState();
  }

  function handleMouseMove(event: MouseEvent) {
    end = { x: event.pageX, y: event.pageY };
  }

  function handleMouseDown(
    event: MouseEvent,
    targetViewerContainerElement: HTMLElement
  ) {
    const target = event.target as HTMLElement;
    if (target?.closest("[data-pdf-annotation-overlay]")) {
      return;
    }
    targetViewerContainerElement?.addEventListener("mouseup", mouseUpHandler);
    falseAll();
    annotClickedComment = "";
    const pageNode = asElement(target.closest(".page"));
    startPageNumber = pageNode
      ? Number(pageNode.dataset.pageNumber)
      : undefined;
    if (!pageNode) {
      return;
    }
    if (
      event.button == 2 ||
      (annotationMode !== AnnotationType.COMMENT &&
        annotationMode !== AnnotationType.TASK &&
        annotationMode !== AnnotationType.SHAPE)
    ) {
      return;
    }

    container = targetViewerContainerElement;
    const startTarget = asElement(event.target);
    if (!isHTMLElement(startTarget)) {
      return;
    }

    start = { x: event.pageX, y: event.pageY };
    end = null;
    locked = false;
    if (annotationMode === AnnotationType.SHAPE) {
      shapeVisible = true;
      targetViewerContainerElement.classList.add("disable-select");
    }
  }

  const mouseUpHandler = (event: any) =>
    handleMouseUp(event, viewerContainerElement);

  function handleMouseUp(
    event: MouseEvent,
    targetViewerContainerElement: HTMLElement
  ) {
    targetViewerContainerElement?.removeEventListener(
      "mouseup",
      mouseUpHandler
    );
    const target = event.target as HTMLElement;
    const pageNode = asElement(target.closest(".page"));
    endPageNumber = Number(asElement(pageNode)?.dataset?.pageNumber);
    const selection = window.getSelection();

    if (!selection?.isCollapsed) {
      selectionChangeHandler(selection);
      return;
    }

    if (!pageNode || !isHTMLElement(pageNode)) {
      return null;
    }

    const pageRect = pageNode.getBoundingClientRect();

    if (!start || startPageNumber !== endPageNumber) {
      return;
    }

    end = { x: event.pageX, y: event.pageY };

    if (annotationMode === AnnotationType.SHAPE) {
      shapeVisible = false;
      targetViewerContainerElement.classList.remove("disable-select");
    }

    const clientRect = getBoundingRectSE(start, end);
    const highlightedRect = {
      top: clientRect.top / scale - pageRect.top / scale,
      left: clientRect.left / scale - pageRect.left / scale,
      width: clientRect.width / scale,
      height: clientRect.height / scale,
      pageNumber: endPageNumber
    } as LTWHP;

    const viewport = pdfViewer?.getPageView(pageNumber - 1)?.viewport;
    const convertedRect: any = viewportToScaled(highlightedRect, viewport);
    convertedRect.pageRectTop = pageRect.top / scale;
    start = null;
    locked = true;
    if (highlightedRect.height == 0 && highlightedRect.width == 0) {
      handleMouseEvent(convertedRect, endPageNumber!, pageRect.top / scale);
    }
    end = null;
    clickBoundingRect = null;
  }

  function handleMouseEvent(
    boundingRect: any,
    targetPageNumber: number,
    pageRectTop: number
  ) {
    annotCickedType = "";
    annotation.rect = boundingRect;
    annotation.pageNumber = targetPageNumber;
    popupStyle = `position: fixed; top: ${end?.y}px; left: ${end?.x}px;z-index: 1000;`;
    if (
      annotationMode === AnnotationType.COMMENT ||
      annotationMode === AnnotationType.TASK
    ) {
      commentEditorVisible = true;
    }
  }

  const detachPdfViewerListeners = () => {
    if (eventBusViewer?.eventBus?.off) {
      if (textLayerRenderedHandler) {
        eventBusViewer.eventBus.off(
          "textlayerrendered",
          textLayerRenderedHandler
        );
      }
      if (findControlStateHandler) {
        eventBusViewer.eventBus.off(
          "updatefindcontrolstate",
          findControlStateHandler
        );
      }
    }

    eventBusViewer = null;
    textLayerRenderedHandler = null;
    findControlStateHandler = null;
  };

  const handleFindControlStateUpdate = (data: any) => {
    if (data?.state === FindState.FOUND || data?.state === FindState.WRAPPED) {
      const element = document.getElementsByClassName(
        "highlight selected"
      )[0] as HTMLElement | undefined;
      if (element && viewerContainerElement) {
        const containerRect = viewerContainerElement.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const offset = 100;
        const targetTop =
          viewerContainerElement.scrollTop +
          (elementRect.top - containerRect.top) -
          offset;
        viewerContainerElement.scrollTo({
          top: Math.max(0, targetTop),
          left: 0,
          behavior: "smooth"
        });
      }
    }
  };

  async function refreshAnnotations() {
    if (!pdfPersistence) return;
    annots = (await pdfPersistence.fetchAllClips())
      .map((annot: any) => ({
        ...annot,
        startPageNumber: annot.startPageNumber ?? annot.pageNumber,
        endPageNumber: annot.endPageNumber ?? annot.pageNumber
      }))
      .filter((annot: any) => annot.startPageNumber)
      .sort((a: any, b: any) => a.startPageNumber - b.startPageNumber);
    onAnnotation?.(annots);
  }

  function removeHighlightLayerComponents(container?: HTMLElement) {
    if (container) {
      const components = highlightLayerComponents.get(container) ?? [];
      components.forEach((component) => {
        void unmount(component);
      });
      highlightLayerComponents.delete(container);
      return;
    }

    highlightLayerComponents.forEach((components) => {
      components.forEach((component) => {
        void unmount(component);
      });
    });
    highlightLayerComponents.clear();
  }

  $effect(() => {
    const currentViewer = pdfViewer;

    if (!currentViewer) {
      detachPdfViewerListeners();
      return;
    }

    detachPdfViewerListeners();
    eventBusViewer = currentViewer;
    textLayerRenderedHandler = renderHighlightLayers;
    findControlStateHandler = handleFindControlStateUpdate;
    currentViewer.eventBus.on("textlayerrendered", textLayerRenderedHandler);
    currentViewer.eventBus.on(
      "updatefindcontrolstate",
      findControlStateHandler
    );

    return () => {
      detachPdfViewerListeners();
    };
  });

  onMount(() => {
    annots = initialAnnots;
    scale = node?.config?.pdfScale ?? resolveDefaultScale();
    pageNumber = node?.config?.pdfPage ?? 1;
    void refreshAnnotations();
    viewerContainerElement = document.getElementById("viewerContainer")!;
    document.addEventListener("keydown", handleKeyDown);
    onViewerMouseDown = (event: MouseEvent) =>
      handleMouseDown(event, viewerContainerElement);
    viewerContainerElement?.addEventListener("mousedown", onViewerMouseDown);
    viewerContainerElement?.addEventListener("scroll", handleScroll);
    viewerContainerElement?.addEventListener("mousemove", handleMouseMove);

    if (node?.config?.pdfPage) {
      restorePagePosition();
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (onViewerMouseDown) {
        viewerContainerElement?.removeEventListener(
          "mousedown",
          onViewerMouseDown
        );
      }
      viewerContainerElement?.removeEventListener("scroll", handleScroll);
      viewerContainerElement?.removeEventListener("mousemove", handleMouseMove);
      detachPdfViewerListeners();
      removeHighlightLayerComponents();
    };
  });

  function restorePagePosition() {
    if (node?.config?.pdfPage && pdfViewer) {
      setTimeout(() => {
        handlePageNavigation(+node.config.pdfPage);
      }, 100);
    }
  }

  onDestroy(() => {
    detachPdfViewerListeners();
    removeHighlightLayerComponents();
  });
</script>

<div class="relative flex flex-col h-full w-full">
  {#if $context.embed !== Embed.HANDSET && $context.os !== OperatingSystem.IOS && isSearchActive}
    <div
      class="flex items-center justify-between w-full h-14 px-4 gap-8 border-b border-b-brs2"
      in:fly={{ y: -20, duration: 300 }}
    >
      <div class="flex gap-6 items-center justify-between search-bar flex-1">
        <div class="w-6/10 flex gap-4 items-center">
          <div class="flex items-center w-9/10">
            <TextInput
              placeholder="Search"
              bind:value={searchText}
              onKeydown={(event) => {
                if (resolveKeyboardKey(event) === "Enter") onSearch();
              }}
              size={Size.sm}
              icon="search"
            />
          </div>
          <div class="flex gap-2 items-center">
            <Button icon="chevron-down" onclick={findNext} />
            <Button icon="chevron-up" onclick={findPrevious} />
          </div>
        </div>
        <div class="flex gap-4 items-center justify-start">
          <SwitchInput
            size={Size.sm}
            label={{ label: "Case sensitive" }}
            bind:checked={searchCaseSensitive}
          />
          <SwitchInput
            size={Size.sm}
            label={{ label: "Highlight all" }}
            bind:checked={searchHighlightAll}
          />
        </div>
      </div>
      {#if dev_isEnableDownloadAnnotatedPdf}
        <div>
          <Button
            icon="download"
            size={Size.sm}
            label="Download"
            onclick={async () => {
              let pdfData;
              if ($context.isEmbed) {
                const embed_message_id = generateSimpleRandomId();
                const response = await fileEmbedChannel.fetch(
                  url.toString(),
                  embed_message_id
                );
                const uint8 =
                  fileEmbedChannel.base64ToUint8Array?.(response) ??
                  (response instanceof ArrayBuffer
                    ? new Uint8Array(response)
                    : new Uint8Array(response));
                pdfData = resolveArrayBuffer(uint8.buffer);
              } else {
                pdfData = await fetch(url.toString()).then((response) =>
                  response.arrayBuffer()
                );
              }
              const blob = await embedAnnotationsandDownload(
                pdfData,
                annots,
                $highlightStore.highlighters
              );
              fileStore.downloadFromBlob(blob, {
                fileName: "annotated_document.pdf",
                contentType: "application/pdf",
                isHandleEmbedCase: true
              });
            }}
          />
        </div>
      {/if}
    </div>
  {/if}
  <div class="w-full flex-1">
    <PdfViewer
      bind:pdfViewer
      bind:pdfDocument
      bind:scale
      {url}
      onReady={() => {
        restorePagePosition();
      }}
    >
      {#if shapeVisible}
        <div
          style="position:absolute;top: {clickBoundingRect?.top}px; left: {clickBoundingRect?.left}px; width: {clickBoundingRect?.width}px; height: {clickBoundingRect?.height}px; border: 2px solid red;z-index:1000;pointer-events:none;"
        ></div>
      {/if}
      {#if inlineToolBarVisible}
        <InlineToolBar
          style={popupStyle}
          bind:selectedColor
          onAnnotate={onInlineAnnotate}
        />
      {/if}
      {#if commentEditorVisible}
        <CommentEditor
          bind:annotationMode
          style={popupStyle}
          onSave={(detail) => {
            commentEditorVisible = false;
            const annotationDetail = detail.dueDate
              ? AnnotationType.TASK
              : AnnotationType.COMMENT;
            annotate({ detail: annotationDetail }, detail);
          }}
          onUpdate={(comment) => {
            commentEditorVisible = false;
            handleUpdateComment(comment);
          }}
          onCancel={() => {
            commentEditorVisible = false;
          }}
          comment={annotClickedComment}
          editingItemType={annotCickedType}
        />
      {/if}
      {#if isInlineEditBarVisible}
        <InlineEditToolBar
          style={popupStyle}
          bind:selectedColor={annotClickedColor}
          onDelete={handleAnnotDelete}
          onColor={handleColorChange}
          onEdit={() => {
            commentEditorVisible = true;
            isInlineEditBarVisible = false;
          }}
          editable={annotCickedType == AnnotationType.COMMENT ||
            annotCickedType == AnnotationType.TASK}
        />
      {/if}
    </PdfViewer>
  </div>
  <div
    class={"absolute cw:bottom-0 cw:inset-x-0 right-0 inset-y-0 m-2 flex gap-2 items-center justify-center"}
  >
    <ToolBar
      bind:selectedAnnotationMode={annotationMode}
      bind:selectedColor
      {pageNumber}
      totalPages={pdfViewer?.pagesCount ?? 1}
      {accessPoint}
      {isSearchActive}
      onPageRerender={handleRenderOptions}
      onSearchToggle={handleSearchToggle}
      onGoToPage={(detail) => handlePageNavigation(detail.page)}
    />
  </div>
</div>
