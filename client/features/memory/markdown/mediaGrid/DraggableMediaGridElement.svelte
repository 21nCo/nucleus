<script lang="ts">
  import type { IMediaGridItem } from "@nucleum/features/memory/node/node.type";
  import { dragAndDropStore } from "@nucleum/stores/app.store";
  import view from "@nucleum/stores/view.store";
  import { DragStatus } from "@nucleum/actions/dragstatus.enum";
  import type { IFile } from "@nucleum/features/files/file.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { fileStore } from "@nucleum/features/files/file.store";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import { cn } from "@21n/utils/ui.utils";

  let {
    isGridItem = true,
    item,
    file = null,
    isDraggable = false,
    isDragging = $bindable(false),
    id,
    ref = $bindable<HTMLElement | undefined>(),
    sizeProperty = "height",
    gap = $bindable(8),
    handleFileUpload,
    onLoad = undefined
  }: {
    isGridItem?: boolean;
    item: IMediaGridItem;
    file?: IFile | null;
    isDraggable?: boolean;
    isDragging?: boolean;
    id: any;
    ref?: HTMLElement | undefined;
    sizeProperty?: "width" | "height";
    gap?: number;
    onLoad?: ((event: CustomEvent<Event>) => void) | undefined;
    handleFileUpload: (
      param1: any,
      param2: any,
      param3: any,
      param4: any
    ) => void;
  } = $props();
  let _file = $state<IFile | null>(null);
  const classList = $derived(
    `${isDraggable ? "cursor-move" : ""} box-border inline-block border-[2.5px] border-transparent`
  );
  const style = $derived(`${sizeProperty}: 100%;
object-fit: scale-down;
cursor: pointer;${sizeProperty == "height" ? `margin:${gap / 2}px;` : ""}`);
  let isDragOver = $state(false);
  let highlightBorder = $state("left");
  const dragId = $derived(id);
  const dragEnterId = $derived(id);
  const dropId = $derived(id);

  async function resolveFile(fileId: IRecordId) {
    return (await fileStore.refresh(fileId)) ?? null;
  }

  $effect(() => {
    let cancelled = false;

    if (file) {
      _file = file;
      return;
    }
    if (!item.file) {
      _file = null;
      return;
    }

    void resolveFile(item.file).then((response) => {
      if (!cancelled) _file = response;
    });

    return () => {
      cancelled = true;
    };
  });

  function removeBorders(element: HTMLElement) {
    element.classList.remove(`${highlightBorder}Throbbing`);
  }
  const handleDragStart = (e: any) => {
    e.stopPropagation();
    isDragging = true;
    dragAndDropStore.update((x: any) => {
      x = { ...x, dragStatus: DragStatus.STARTED, dragItem: item, dragId };
      return x;
    });
  };
  const handleDragEnter = async (e: any) => {
    e.stopPropagation();
    isDragOver = true;
    dragAndDropStore.update((x: any) => {
      x = {
        ...x,
        dragStatus: DragStatus.DRAGGING,
        dragEnterItem: item,
        dragEnterId
      };
      return x;
    });
    if (!isGridItem) return;
    function isInView(element: any) {
      const parentBoundingBox = element.parentElement.getBoundingClientRect();
      const boundingBox = element.getBoundingClientRect();
      return (
        boundingBox.top >= 0 && boundingBox.bottom <= parentBoundingBox.bottom
      );
    }
    if (!ref) return;
    let isInV = isInView(ref);
    if ($view.isPortrait || !isInV) {
      await ref.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };
  const handleDragEnd = (e: any) => {
    e.stopPropagation();
    isDragging = false;
  };
  /**
   * dt.files[0] is true when drag & drop from system files
   * @param e
   */
  const handleDrop = (e: any) => {
    e.stopPropagation();
    isDragOver = false;
    isDragging = false;
    const element = e.target;
    removeBorders(element);
    let dt = e?.dataTransfer;
    if (dt?.files[0]) {
      handleFileUpload(
        e,
        highlightBorder == "right" || highlightBorder == "bottom"
          ? item.position.auto + 1
          : item.position.auto,
        item.position.columns.columnNo,
        highlightBorder == "bottom"
          ? item.position.columns.index + 1
          : item.position.columns.index
      );
    } else {
      dragAndDropStore.update((x: any) => {
        x = {
          ...x,
          dragStatus: DragStatus.DROPPED,
          dropItem: item,
          dropId,
          forwardDrop:
            highlightBorder == "right" || highlightBorder == "bottom"
              ? true
              : false
        };
        return x;
      });
    }
  };
  function onDragOver(e: any) {
    e?.stopPropagation();
    e?.preventDefault();
    if (!isGridItem) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = e.target.offsetWidth;
    const height = e.target.offsetHeight;
    const element = e.target;
    removeBorders(element);
    if (sizeProperty == "width") {
      if (y <= height / 2) {
        highlightBorder = "top";
      } else {
        highlightBorder = "bottom";
      }
    } else {
      if (x <= width / 2) {
        highlightBorder = "left";
      } else {
        highlightBorder = "right";
      }
    }
    element.classList.add(`${highlightBorder}Throbbing`);
  }
  function handleDragLeave(e: any) {
    e.stopPropagation();
    isDragOver = false;
    const element = e.target;
    removeBorders(element);
    dragAndDropStore.update((x: any) => {
      x = { ...x, dragLeaveItem: item };
      return x;
    });
  }
  function draggable(node: HTMLElement) {
    node.addEventListener("dragstart", handleDragStart);
    node.addEventListener("dragend", handleDragEnd);
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragenter", handleDragEnter);
    node.addEventListener("dragleave", handleDragLeave);
    node.addEventListener("drop", handleDrop);

    return {
      destroy() {
        node.removeEventListener("dragstart", handleDragStart);
        node.removeEventListener("dragend", handleDragEnd);
        node.removeEventListener("dragover", onDragOver);
        node.removeEventListener("dragenter", handleDragEnter);
        node.removeEventListener("dragleave", handleDragLeave);
        node.removeEventListener("drop", handleDrop);
      }
    };
  }
</script>

{#if _file}
  <FileView
    file={_file}
    class={classList}
    {style}
    {isDraggable}
    {onLoad}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
    onDragOver={onDragOver}
    onDragEnter={handleDragEnter}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    bind:ref
  />
{:else if id.includes("DropArea")}
  <div
    draggable={false}
    use:draggable
    class={cn(
      "absolute w-full h-full bg-opacity-50 rounded-md flex items-center justify-center text-b2 text-fgs2",
      {
        "bg-bgs3": isDragOver,
        "bg-bgs2": !isDragOver
      }
    )}
  >
    Column: {item.position.columns.columnNo + 1}
  </div>
{/if}
{#if file?.type.startsWith("application/pdf")}
  <div
    class="{classList} min-w-[100px] h-full overflow-hidden"
    {style}
    draggable={isDraggable}
    use:draggable
    bind:this={ref}
  >
    <embed
      src={file.url}
      width="110%"
      height="110%"
      style="pointer-events: none;"
    />
  </div>
{/if}
