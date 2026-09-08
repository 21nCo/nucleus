<script lang="ts">
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import {
    FileType,
    type IFile,
    type IImageRepositionerOptions
  } from "@nucleum/stores/files/file.type";
  import { fileStore } from "@nucleum/stores/files/file.store";
  import { onMount } from "svelte";
  import { fileLoader, fileLoaderv2 } from "@nucleum/actions/lazyload.action";
  import { imageRepositioner } from "@nucleum/actions/imageRepositioning.action";
  import { isSameResource } from "@nucleum/datafn/resource.utils";
  import { debouncer } from "@21n/utils/utils";

  let {
    file = $bindable(),
    id = undefined,
    blob = undefined,
    isLazyLoad = false,
    type = $bindable(FileType.UNKNOWN),
    isDraggable = false,
    style = "",
    ref = $bindable(),
    repositionParams = undefined,
    isHideControls = false,
    renderingDetails = $bindable(),
    isUseThumbnailIfAvailable = false,
    isApplyBgColor = false,
    class: classList = "",
    onLoad = undefined,
    onReposition = undefined,
    onRepositionDebounced = undefined,
    onDragStart = undefined,
    onDragEnd = undefined,
    onDragOver = undefined,
    onDragEnter = undefined,
    onDragLeave = undefined,
    onDrop = undefined
  }: {
    file?: IFile | undefined;
    id?: IRecordId | undefined;
    blob?: Blob | undefined;
    isLazyLoad?: boolean;
    type?: FileType;
    isDraggable?: boolean;
    style?: string;
    ref?: HTMLElement | undefined;
    repositionParams?: IImageRepositionerOptions | undefined;
    isHideControls?: boolean;
    renderingDetails?: any;
    isUseThumbnailIfAvailable?: boolean;
    isApplyBgColor?: boolean;
    class?: string;
    onLoad?: ((event: CustomEvent<Event>) => void) | undefined;
    onReposition?: ((event: CustomEvent<number>) => void) | undefined;
    onRepositionDebounced?: ((event: CustomEvent<number>) => void) | undefined;
    onDragStart?: ((event: DragEvent) => void) | undefined;
    onDragEnd?: ((event: DragEvent) => void) | undefined;
    onDragOver?: ((event: DragEvent) => void) | undefined;
    onDragEnter?: ((event: DragEvent) => void) | undefined;
    onDragLeave?: ((event: DragEvent) => void) | undefined;
    onDrop?: ((event: DragEvent) => void) | undefined;
  } = $props();

  function isCallable<T extends (...args: any[]) => any>(
    value: unknown
  ): value is T {
    return typeof value === "function";
  }
  /**
   * If true, then use the thumbnail if available
   */
  const _id = $derived(id ?? file?.id);

  function resolveType() {
    if (!id && !file && !blob) {
      return FileType.UNKNOWN;
    }
    if (blob) {
      return blob.type.split("/")[0] as FileType;
    }
    const idVal = id ?? file?.id;
    const typePart = idVal?.toString()?.split(":")[1]?.split("_")[0];
    if (!typePart) return FileType.UNKNOWN;
    return typePart as FileType;
  }

  onMount(async () => {
    // if (!isLazyLoad) await resolveSrc();
    if (type === FileType.UNKNOWN) type = resolveType();
  });

  async function resolveSrc(): Promise<string> {
    const isLatestFilePresent = file && _id && isSameResource(file, _id);
    if (blob) return URL.createObjectURL(blob);
    else if (id || isLatestFilePresent) {
      const fileToRefresh = isLatestFilePresent ? file : id;
      if (!fileToRefresh) return "";
      const result = await fileStore.refresh(fileToRefresh, {
        isUseThumbnailIfAvailable
      });
      if (result) {
        file = result;
        if (isUseThumbnailIfAvailable && file?.thumbnailUrl) {
          return file.thumbnailUrl;
        }
        return file.url ?? "";
      }
    }
    return "";
  }

  function handlePositionChange(newPosition: number) {
    const repositionEvent = new CustomEvent<number>("reposition", {
      detail: newPosition
    });
    if (isCallable(onReposition)) onReposition(repositionEvent);
    debouncedRepositionPropagation(newPosition);
  }
  const debouncedRepositionPropagation = debouncer((newPosition: number) => {
    const repositionDebouncedEvent = new CustomEvent<number>(
      "repositionDebounced",
      { detail: newPosition }
    );
    if (isCallable(onRepositionDebounced)) {
      onRepositionDebounced(repositionDebouncedEvent);
    }
  }, 1000);

  function onImageLoad(e: Event) {
    if (ref && ref instanceof HTMLImageElement) {
      renderingDetails = {
        originalHeight: ref.naturalHeight,
        originalWidth: ref.naturalWidth,
        renderedHeight: ref.clientHeight,
        renderedWidth: ref.clientWidth
      };
    }
    const loadEvent = new CustomEvent<Event>("load", {
      detail: e
    });
    if (isCallable(onLoad)) onLoad(loadEvent);
  }
</script>

{#if type === FileType.IMAGE || (isUseThumbnailIfAvailable && file?.thumbnailUrl)}
  <img
    alt="..."
    onload={onImageLoad}
    class={classList + " ph-no-capture userdata"}
    draggable={isDraggable}
    use:fileLoaderv2={{
      source: resolveSrc,
      isLazyLoad,
      id: _id?.toString(),
      isApplyBgColorFromImage: isApplyBgColor
    }}
    use:imageRepositioner={{
      onPositionChange: handlePositionChange,
      ...(repositionParams ?? {
        enabled: false
      })
    }}
    {style}
    bind:this={ref}
    ondragstart={onDragStart}
    ondragend={onDragEnd}
    ondragover={onDragOver}
    ondragenter={onDragEnter}
    ondragleave={onDragLeave}
    ondrop={onDrop}
  />
{:else if type === FileType.VIDEO}
  <video
    controls={!isHideControls}
    class={classList + " ph-no-capture userdata"}
    draggable={isDraggable}
    use:fileLoaderv2={{ source: resolveSrc, isLazyLoad, id: _id?.toString() }}
    {style}
    bind:this={ref}
    ondragstart={onDragStart}
    ondragend={onDragEnd}
    ondragover={onDragOver}
    ondragenter={onDragEnter}
    ondragleave={onDragLeave}
    ondrop={onDrop}
  >
    <track kind="captions" />
  </video>
{:else if type === FileType.AUDIO}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <!--  -->
{:else if type === FileType.PDF}
  <!--  -->
{/if}

<style>
  .leftThrobbing {
    animation: leftThrobbing 1s infinite;
  }
  .rightThrobbing {
    animation: rightThrobbing 1s infinite;
  }
  .topThrobbing {
    animation: topThrobbing 1s infinite;
  }
  .bottomThrobbing {
    animation: bottomThrobbing 1s infinite;
  }
  @keyframes leftThrobbing {
    0% {
      border-left-color: green;
    }
    50% {
      border-left-color: rgb(14, 153, 247);
    }
    100% {
      border-left-color: green;
    }
  }
  @keyframes rightThrobbing {
    0% {
      border-right-color: green;
    }
    50% {
      border-right-color: rgb(14, 153, 247);
    }
    100% {
      border-right-color: green;
    }
  }
  @keyframes topThrobbing {
    0% {
      border-top-color: green;
    }
    50% {
      border-top-color: rgb(14, 153, 247);
    }
    100% {
      border-top-color: green;
    }
  }
  @keyframes bottomThrobbing {
    0% {
      border-bottom-color: green;
    }
    50% {
      border-bottom-color: rgb(14, 153, 247);
    }
    100% {
      border-bottom-color: green;
    }
  }
</style>
