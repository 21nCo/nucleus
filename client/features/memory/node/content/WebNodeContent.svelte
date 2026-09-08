<script lang="ts">
  import WebPagePreview from "@nucleum/features/memory/node/content/web/WebPagePreview.svelte";
  import { type IClip, type IWebPage, socialPostNodeTypeList, socialProfileNodeTypeList, socialSubNodeTypeList } from "@nucleum/features/memory/node/node.type";
import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import SocialPostContent from "@nucleum/features/memory/node/content/web/social/SocialPostContent.svelte";
  import SocialProfileContent from "@nucleum/features/memory/node/content/web/social/SocialProfileContent.svelte";
  import WebClipPreview from "@nucleum/features/memory/node/content/web/WebClipPreview.svelte";
  import YoutubeVideoPreview from "@nucleum/features/memory/node/content/web/YoutubeVideoPreview.svelte";
  import KindleBookPreview from "@nucleum/features/memory/node/content/web/KindleBookPreview.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import GistPreview from "@nucleum/features/memory/node/content/web/GistPreview.svelte";
  import SocialSubContent from "@nucleum/features/memory/node/content/web/social/SocialSubContent.svelte";
  let {
    node,
    accessPoint = ResourceAccessPoint.SELF
  }: {
    node: IClip | IWebPage;
    accessPoint?: ResourceAccessPoint;
  } = $props();
  let youtubeVideoRef = $state<YoutubeVideoPreview | undefined>(undefined);

  export function onTrace(e: any) {
    youtubeVideoRef?.onTrace(e);
  }
</script>

<div class="relative h-full w-full flex flex-col flex-col-reverse">
  {#if node.contentType === NodeType.WEB_PAGE || node.contentType === NodeType.YOUTUBE_CHANNEL}
    <WebPagePreview {node} {accessPoint} />
  {:else if node.contentType === NodeType.GIST}
    <GistPreview {node} {accessPoint} />
  {:else if node.contentType === NodeType.WEB_TEXT_BOOKMARK || node.contentType === NodeType.WEB_SCREENSHOT || node.contentType === NodeType.KINDLE_HIGHLIGHT}
    <WebClipPreview {node} {accessPoint} />
  {:else if socialPostNodeTypeList.has(node.contentType)}
    <SocialPostContent {node} {accessPoint} />
  {:else if socialProfileNodeTypeList.has(node.contentType)}
    <SocialProfileContent {node} />
  {:else if socialSubNodeTypeList.has(node.contentType)}
    <SocialSubContent {node} />
  {:else if node.contentType === NodeType.KINDLE_BOOK}
    <KindleBookPreview {node} />
  {:else if (node.contentType === NodeType.YOUTUBE_VIDEO || node.contentType === NodeType.YOUTUBE_SHORT || node.contentType === NodeType.YOUTUBE_BOOKMARK) && node.url}
    <YoutubeVideoPreview
      url={node.url}
      timestamp={node.body && "timestamp" in node.body
        ? node.body.timestamp
        : null}
      bind:this={youtubeVideoRef}
    />
  {/if}
</div>
