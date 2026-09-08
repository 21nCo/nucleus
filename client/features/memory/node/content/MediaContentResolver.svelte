<script lang="ts">
  import { type IAudioBody, type IClip, type IWebPage, webNodeTypeList, type INode } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import WebNodeContent from "@nucleum/features/memory/node/content/WebNodeContent.svelte";
  import PdfAnnotator from "@nucleum/features/memory/pdfAnnotator/PdfAnnotator.svelte";
  import FileView from "@nucleum/components/files/FileView.svelte";
  import AudioContent from "@nucleum/features/memory/audio/AudioContent.svelte";
  import type { IFile } from "@nucleum/stores/files/file.type";
  import { fileStore } from "@nucleum/stores/files/file.store";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { formatBytes } from "@21n/shared-utils/text.utils";
  import { resolveFileIcon } from "@nucleum/features/memory/node/node.utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  let {
    node,
    accessPoint = ResourceAccessPoint.SELF,
    isHidePreview = false,
    renderingDetails = $bindable(),
    onAnnotation = undefined,
    onConfigUpdate = undefined,
    onRefresh = undefined
  }: {
    node: INode;
    accessPoint?: ResourceAccessPoint;
    isHidePreview?: boolean;
    renderingDetails?: any;
    onAnnotation?: ((annotations: any[]) => void) | undefined;
    onConfigUpdate?: ((detail: any) => void) | undefined;
    onRefresh?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  let pdfContent = $state<any>(undefined);
  let webContentRef = $state<any>(undefined);
  let _file = $state<IFile | undefined>(undefined);
  let _url = $state("");
  let dataPromise = $state<Promise<void>>(Promise.resolve());
  let currentFileId = "";

  function resolveFileSource() {
    return (
      node.file ??
      (typeof node.body === "object" && node.body ? node.body.file : undefined)
    );
  }

  export function onTraceClick(details: any) {
    if (node.contentType === NodeType.PDF) {
      pdfContent?.scrollToAnnot(details.id, details.pageNumber);
    } else if (
      node.contentType === NodeType.YOUTUBE_VIDEO ||
      node.contentType === NodeType.YOUTUBE_SHORT
    ) {
      webContentRef?.onTrace(details);
    }
  }

  async function resolveData() {
    const fileSource = resolveFileSource();
    if (!fileSource) return;
    const result = await fileStore.refresh(fileSource);
    if (!result) return;
    _file = result;
    _url = _file.url ?? "";
    if (node.contentType === NodeType.PDF) {
      logger.log({
        at: "MediaContentResolver.resolveData",
        nodeId: node.id,
        contentType: node.contentType,
        fileId: _file.id,
        fileType: _file.type,
        url: _url
      });
    }
  }

  function resolveFileId() {
    const file = resolveFileSource() as
      | string
      | { id?: string | number }
      | undefined;
    if (typeof file === "string") return file;
    if (file && typeof file === "object" && file.id != null) {
      return String(file.id);
    }
    return "";
  }

  $effect(() => {
    const fileId = resolveFileId();
    if (fileId === currentFileId) return;
    currentFileId = fileId;
    _file = undefined;
    _url = "";
    dataPromise = fileId ? resolveData() : Promise.resolve();
  });

  function resolveAudioBody(body: INode["body"]) {
    return typeof body === "object" && body ? (body as IAudioBody) : undefined;
  }

  function resolveWebNode(node: INode) {
    return node as unknown as IClip | IWebPage;
  }
</script>

{#await dataPromise}
  <div class="flex w-full h-full items-center justify-center">
    <div
      class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"
    ></div>
  </div>
{:then}
  {#if _file && (node.contentType === NodeType.FILE || isHidePreview)}
    <button class="flex w-full items-center justify-between h-12">
      <span class="flex items-center gap-2">
        <Icon icon={resolveFileIcon(_file)} size={Size.lg} />
        <span class="text-sm">{_file.label}</span>
        <span class="text-xs text-fgs4">
          {_file.size ? formatBytes(_file.size) : "Unknown size"}
        </span>
      </span>
    </button>
  {:else if node.contentType === NodeType.AUDIO && _url}
    <!-- <audio controls src={$node.body?.url} /> -->
    <!-- TODO - relay refresh event to top instead of refreshing here -->
    <AudioContent
      {onRefresh}
      body={resolveAudioBody(node.body)}
      url={_url}
      nodeId={node.id.toString()}
      metadata={node.metadata}
      {accessPoint}
    />
  {:else if (node.contentType === NodeType.IMAGE || node.contentType === NodeType.VIDEO) && _file}
    <FileView file={_file} bind:renderingDetails class="!object-contain" />
  {:else if webNodeTypeList.includes(node.contentType)}
    <WebNodeContent
      node={resolveWebNode(node)}
      bind:this={webContentRef}
      {accessPoint}
    />
  {:else if node.contentType === NodeType.PDF && _url}
    <PdfAnnotator
      bind:this={pdfContent}
      url={_url}
      {node}
      {accessPoint}
      {onAnnotation}
      {onConfigUpdate}
    />
  {/if}
{/await}
