<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/types/text.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { enumToString, formatBytes } from "@21n/shared-utils/text.utils";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import {
    headingNodeTypes,
    NodeType,
    webNodeTypeList
  } from "@nucleum/features/memory/node/node.type";
  import BasicInfoItem from "@nucleum/features/memory/node/metadata/BasicInfoItem.svelte";
  import InfoCard from "@nucleum/features/memory/node/metadata/InfoCard.svelte";

  import { ResourceActionType } from "@nucleum/datafn/resource.type";
  import type { DatafnDateValue } from "@nucleum/datafn/resource.type";
  import type { IAccessLog } from "@nucleum/features/system/accessLogging/accessLog.type";
  import { page } from "$app/stores";
  import AudioMetadata from "@nucleum/features/memory/node/metadata/AudioMetadata.svelte";
  import ImageMetadata from "@nucleum/features/memory/node/metadata/ImageMetadata.svelte";
  import LocationProperty from "@nucleum/features/collections/properties/locationProperty/LocationProperty.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { toSvelteStore } from "@datafn/svelte";
  import { toDateValue } from "@21n/utils/time.utils";
  let {
    node,
    renderingDetails = undefined
  }: {
    node: IActiveNodeStore;
    renderingDetails?: any;
  } = $props();
  const accessLogStore = $derived.by(() =>
    toSvelteStore<IAccessLog[]>(
      $node.id
        ? datafn.accessLog.signal({
            filters: {
              resourceId: $node.id.toString()
            },
            select: ["id", "resourceId", "action", "timestamp", "createdAt"]
          })
        : datafn.emptySignal([]),
      { initialData: [] }
    )
  );
  const viewLogs = $derived.by(() =>
    [...$accessLogStore.data]
      .filter((x) => x.action === ResourceActionType.OPEN)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  );
  const lastAccessLog = $derived.by(() => {
    if (viewLogs.length === 0) return undefined;
    const currentAccess = $node.accessMode + "At";
    const currentAccessId = $page.url.searchParams.get(currentAccess);
    if (
      currentAccessId &&
      new Date(viewLogs[0].timestamp).getTime() === parseInt(currentAccessId)
    ) {
      return viewLogs[1];
    }
    return viewLogs[0];
  });
  let kind = $derived(resolveKind($node.contentType));
  let isMediaNode = $derived(
    $node.contentType !== NodeType.NODULAR_MARKDOWN &&
      $node.contentType !== NodeType.NON_NODULAR_MARKDOWN &&
      $node.contentType !== NodeType.PDF
  );
  let isWebNode = $derived(webNodeTypeList.includes($node.contentType));

  function resolveKind(contentType: NodeType) {
    if (
      headingNodeTypes.includes(contentType) ||
      contentType === NodeType.NODULAR_MARKDOWN ||
      contentType === NodeType.NON_NODULAR_MARKDOWN
    )
      return "Markdown";
    else return enumToString(contentType);
  }

  function calculateReadingTime(wordCount: number | undefined) {
    if (!wordCount) return "NA";
    const minutes = wordCount / 200;
    if (minutes < 1) {
      return "Less than a minute";
    } else if (minutes < 60) {
      return `${Math.round(minutes)} minute${minutes >= 1.5 ? "s" : ""}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = Math.round(minutes % 60);
      return `${hours} hour${hours > 1 ? "s" : ""} ${remainingMinutes} minute${remainingMinutes !== 1 ? "s" : ""}`;
    }
  }

  function resolveInfoValue(value: DatafnDateValue | undefined | null) {
    return toDateValue(value)?.toISOString();
  }

  function resolveFileFormat(fileType: string) {
    if (!fileType) return "NA";
    if (fileType.includes("image/jpeg")) return "jpeg";
    else if (fileType.includes("image/png")) return "png";
    else if (fileType.includes("image/gif")) return "gif";
    else if (fileType.includes("image/svg+xml")) return "svg";
    else if (fileType.includes("video/mp4")) return "mp4";
    else if (fileType.includes("video/quicktime")) return "quicktime";
    else if (fileType.includes("video/x-msvideo")) return "avi";
    else if (fileType.includes("video/x-ms-wmv")) return "wmv";
    else if (fileType.includes("video/x-flv")) return "flv";
    else if (fileType.includes("audio/mpeg")) return "mp3";
    else if (fileType.includes("audio/mp3")) return "mp3";
    else if (fileType.includes("audio/x-wav")) return "wav";
    else if (fileType.includes("audio/x-ms-wma")) return "wma";
    else if (fileType.includes("audio/webm")) return "webm";
    else return "NA";
  }

</script>

<div class="flex flex-col gap-3 w-full flex-grow items-start">
  <div class={cn("flex w-full flex-col gap-3")}>
    <div class={cn("flex flex-col gap-3 rounded-md mo:p-2 p-4 w-full bg-bgs2")}>
      <BasicInfoItem label="Kind" value={kind} />
      {#if isMediaNode && !isWebNode && "file" in $node}
        <BasicInfoItem
          label="File format"
          value={$node.file?.type ? resolveFileFormat($node.file.type) : "NA"}
        />
        <BasicInfoItem
          label="Storage size"
          value={$node.file?.size ? formatBytes($node.file.size) : "NA"}
        />
      {/if}
      <BasicInfoItem
        label={isWebNode ? "Saved at" : "Created at"}
        value={resolveInfoValue($node.createdAt)}
      />
      {#if lastAccessLog}
        <BasicInfoItem
          label="Last viewed at"
          value={resolveInfoValue(lastAccessLog?.createdAt)}
        />
      {/if}
      {#if !isWebNode}
        <BasicInfoItem
          label="Last modified at"
          value={resolveInfoValue($node.updatedAt)}
        />
      {/if}
    </div>
    {#if $node.contentType === NodeType.AUDIO && $node.metadata}
      <AudioMetadata
        metadata={$node.metadata}
        duration={$node.file?.duration}
      />
    {/if}
    {#if $node.contentType === NodeType.IMAGE}
      <ImageMetadata metadata={$node.metadata} {renderingDetails} />
    {/if}
    <div class="flex flex-wrap gap-3">
      {#if viewLogs && viewLogs.length > 0}
        <InfoCard label="Total view count" value={viewLogs.length} />
      {/if}
      {#if !isMediaNode}
        <InfoCard label="Word count" value={$node.wordCount} />
        <InfoCard
          label="Reading length"
          value={calculateReadingTime($node.wordCount)}
        />
      {/if}
    </div>
    {#if $node.metadata?.location}
      <div class={cn("rounded-md w-full bg-bgs2")}>
        <LocationProperty location={$node.metadata?.location} />
      </div>
    {/if}
  </div>
</div>
