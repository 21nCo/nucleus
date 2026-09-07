<script lang="ts">
  import { hoverable } from "@nucleum/actions/hover.action";
  import { tooltip } from "@nucleum/actions/popover.action";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { resolveResource } from "@nucleum/datafn/resource-query.utils";
  import NodeAvatar from "@nucleum/features/memory/node/avatar/NodeAvatar.svelte";
  import { webNodeTypeList } from "@nucleum/features/memory/node/node.type";
  import { resolveNodeLabelString } from "@nucleum/features/memory/node/node.utils";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import { onMount } from "svelte";

  let {
    id,
    label = null
  }: {
    id: string;
    label?: string | null;
  } = $props();
  let resource: any;
  let isLoading: boolean = true;
  let isHovering: boolean = false;

  const hasAvatar = $derived(
    (resource?.collections && resource.collections.length > 0) ||
      webNodeTypeList.includes(resource?.contentType)
  );

  onMount(async () => {
    try {
      isLoading = true;
      resource = await resolveResource(id);
    } catch (e) {
      logger.error({ at: "InlineMention.onMount", error: e });
    } finally {
      isLoading = false;
    }
  });
</script>

<a
  class="inline-mention px-1 bg-bgs2 notouch:hover:bg-bgs3 active:bg-bgs3 rounded-md max-w-48 truncate"
  data-record-id={id}
  data-label={label}
  href={`${window.location.pathname}${window.location.search}${window.location.search ? "&" : "?"}pop=${id}`}
  contenteditable="false"
  use:hoverable={{
    onHover: (val) => {
      isHovering = val;
    }
  }}
  use:tooltip={{
    text: `Go to **${label ?? "unknown"}**`,
    delay: 1500
  }}
>
  <span style="">
    <!-- TODO - applying below font-size is causing subtle flickering -->
    <!-- {#if isHovering}
      <span style="font--size: 0.85rem;"> &rarr; </span>
    {:else} -->
    <span
      style={hasAvatar
        ? "vertical-align: -0.1em;"
        : "font--size: 1.1rem; vertical-align: 0.06em;"}
    >
      {#if hasAvatar}
        <span class="inline-block h-4 w-4">
          <NodeAvatar
            node={resource}
            accessPoint={ResourceAccessPoint.MARKDOWN_MENTION}
          />
        </span>
      {:else if isHovering}
        &#11042;
      {:else}
        &#11041;
      {/if}
    </span>
    <!-- {/if} -->
  </span>
  <span class="text-wrap truncate">
    {#if isLoading}
      {label ?? "Loading..."}
    {:else}
      {resolveNodeLabelString(resource) ?? label ?? "Unknown"}
    {/if}
  </span>
</a>
