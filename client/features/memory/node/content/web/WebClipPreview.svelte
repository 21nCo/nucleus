<script lang="ts">
  import FileView from "@nucleum/features/files/FileView.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { cn } from "@21n/utils/ui.utils";
  import {
    type IKindleHighlight,
    type ITextClip,
    type IWebScreenshotClip,
    NodeType
  } from "@nucleum/features/memory/node/node.type";
  import { resolveContentPreview } from "@nucleum/features/memory/node/node.utils";
  import TextClipPreview from "@nucleum/features/memory/node/content/web/TextClipPreview.svelte";
  let {
    node,
    accessPoint = ResourceAccessPoint.SELF,
    truncateLength = undefined
  }: {
    node: ITextClip | IWebScreenshotClip | IKindleHighlight;
    accessPoint?: ResourceAccessPoint;
    truncateLength?: number | undefined;
  } = $props();
  let contentPreview = $derived(resolveContentPreview(node));
</script>

<div
  class={cn("w-full h-full flex items-center", {
    "max-h-32": accessPoint !== ResourceAccessPoint.SELF,
    "justify-center": accessPoint === ResourceAccessPoint.SELF
  })}
>
  {#if node.contentType === NodeType.WEB_TEXT_BOOKMARK || node.contentType === NodeType.KINDLE_HIGHLIGHT}
    <TextClipPreview
      {node}
      contentPreview={contentPreview ?? ""}
      {truncateLength}
      {accessPoint}
    />
  {:else if node.contentType === NodeType.WEB_SCREENSHOT && node.body.file}
    <!-- <img
      alt="..."
      class="absolute inset-0 w-full rounded-t-md object-contain h-full"
      src={node.body.s3Url}
    /> -->
    <FileView
      id={node.body.file}
      class={cn("h-full w-full", {
        "object-cover rounded-md": accessPoint === ResourceAccessPoint.CLIPPER,
        "!object-contain": accessPoint !== ResourceAccessPoint.CLIPPER
      })}
    />
  {/if}
</div>
