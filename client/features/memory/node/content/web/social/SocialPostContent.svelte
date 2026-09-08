<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import type { INode } from "@nucleum/features/memory/node/node.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import TweetPreviewUsingWidget from "@nucleum/features/memory/node/content/web/social/TweetPreviewUsingWidget.svelte";
  import InstagramPostWidget from "@nucleum/features/memory/node/content/web/social/InstagramPostWidget.svelte";
  import LinkedInPostWidget from "@nucleum/features/memory/node/content/web/social/LinkedInPostWidget.svelte";
  import RedditPostWidget from "@nucleum/features/memory/node/content/web/social/RedditPostWidget.svelte";
  import FacebookPostWidget from "@nucleum/features/memory/node/content/web/social/FacebookPostWidget.svelte";
  import MastodonPostWidget from "@nucleum/features/memory/node/content/web/social/MastodonPostWidget.svelte";
  import BlueskyPostWidget from "@nucleum/features/memory/node/content/web/social/BlueskyPostWidget.svelte";
  import ThreadsPostWidget from "@nucleum/features/memory/node/content/web/social/ThreadsPostWidget.svelte";
  import account from "@nucleum/stores/account.store";
  import SocialPostContentFallback from "@nucleum/features/memory/node/content/web/social/SocialPostContentFallback.svelte";
  import context from "@nucleum/stores/context.store";
  import Icon from "@21n/elements/Icon.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { Context } from "@nucleum/stores/appStore.type";

  let {
    node,
    accessPoint = ResourceAccessPoint.SELF
  }: {
    node: INode;
    accessPoint?: ResourceAccessPoint;
  } = $props();
  void accessPoint;

  const nodeContext = getContext<any>(Context.NODE);
  let oembedHtml: string | null = null;
  let error = $state("");
  let isShowPermanentCopy = $state(false);
  onMount(async () => {
    await resolveParent();
  });

  async function resolveParent() {
    if (nodeContext?.parent) parent = nodeContext.parent;
  }

  function shouldShowWidget() {
    if (!account.isCloudUserAndOnline()) return false;

    const supportedWidgets = [
      NodeType.TWEET,
      NodeType.INSTAGRAM_POST,
      NodeType.INSTAGRAM_REEL,
      NodeType.LINKEDIN_POST,
      NodeType.REDDIT_POST,
      NodeType.MASTODON_POST,
      NodeType.BLUESKY_POST,
      NodeType.THREADS_POST
    ];

    const supportedWidgetsOnEmbed = [
      NodeType.TWEET,
      NodeType.INSTAGRAM_POST,
      NodeType.INSTAGRAM_REEL,
      NodeType.MASTODON_POST,
      NodeType.BLUESKY_POST,
      NodeType.THREADS_POST
    ];

    if ($context.isEmbed) {
      return supportedWidgetsOnEmbed.includes(node.contentType);
    } else {
      return supportedWidgets.includes(node.contentType);
    }
  }

  function onError(message: string) {
    error = message;
  }
</script>

{#if oembedHtml}
  {@html oembedHtml}
{:else if shouldShowWidget() && node.url && !error && !isShowPermanentCopy}
  <div
    class="relative w-full h-full flex flex-col justify-center items-center overflow-y-auto cw:mb-10"
  >
    <div class="absolute inset-0 flex justify-center items-center z-0 mb-12">
      <Icon icon="svg-spinners:3-dots-fade" size={Size.lg} />
    </div>
    <div
      class="relative w-9/10 flex-grow flex flex-col items-center max-w-2xl px-4 py-6 z-10"
    >
      {#if $context.isEmbed}
        <button
          class="absolute inset-0 z-20"
          aria-label="Keep embed interaction inside the preview"
          onclick={(event) => event.stopPropagation()}
        ></button>
      {/if}
      {#if node.contentType === NodeType.TWEET}
        <TweetPreviewUsingWidget tweetUrl={node.url} />
      {:else if node.contentType === NodeType.INSTAGRAM_POST || node.contentType === NodeType.INSTAGRAM_REEL}
        <InstagramPostWidget postUrl={node.url} />
      {:else if node.contentType === NodeType.LINKEDIN_POST}
        <LinkedInPostWidget postUrl={node.url} />
      {:else if node.contentType === NodeType.REDDIT_POST}
        <RedditPostWidget postUrl={node.url} />
      {:else if node.contentType === NodeType.FACEBOOK_POST}
        <FacebookPostWidget postUrl={node.url} {onError} onFallback={onError} />
      {:else if node.contentType === NodeType.MASTODON_POST}
        <MastodonPostWidget postUrl={node.url} {onError} onFallback={onError} />
      {:else if node.contentType === NodeType.BLUESKY_POST}
        <BlueskyPostWidget postUrl={node.url} {onError} />
      {:else if node.contentType === NodeType.THREADS_POST}
        <ThreadsPostWidget postUrl={node.url} {onError} onFallback={onError} />
      {/if}
    </div>
  </div>
{:else}
  <SocialPostContentFallback
    {node}
    onViewEmbed={() => {
      isShowPermanentCopy = !isShowPermanentCopy;
    }}
  />
{/if}
