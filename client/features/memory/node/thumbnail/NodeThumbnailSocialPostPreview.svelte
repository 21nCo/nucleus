<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { resolveNodeIcon } from "@nucleum/features/memory/node/node.utils";
  let {
    text,
    contentType,
    isVertical = false,
    accessPoint = ResourceAccessPoint.SELF,
    isFullExpand = false
  }: {
    text: string;
    contentType: NodeType;
    isVertical?: boolean;
    accessPoint?: ResourceAccessPoint;
    isFullExpand?: boolean;
  } = $props();
</script>

<p
  class={cn(
    "leading-5",
    {
      "flex flex-col": isVertical
    },
    !isFullExpand && {
      "line-clamp-3":
        accessPoint !== ResourceAccessPoint.SELF &&
        accessPoint !== ResourceAccessPoint.NODE_TRACES,
      "line-clamp-5": accessPoint === ResourceAccessPoint.NODE_TRACES
    }
  )}
>
  <span class="align-text-top">
    {#if contentType === NodeType.TWEET}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="inline-block align-text-bottom w-[1.4em] h-[1.4em] p-0.5 mx-[0.05em] translate-y-[-0.1em]"
        viewBox="0 0 256 256"
      >
        <path
          fill="currentColor"
          d="m214.75 211.71l-62.6-98.38l61.77-67.95a8 8 0 0 0-11.84-10.76l-58.84 64.72l-40.49-63.63A8 8 0 0 0 96 32H48a8 8 0 0 0-6.75 12.3l62.6 98.37l-61.77 68a8 8 0 1 0 11.84 10.76l58.84-64.72l40.49 63.63A8 8 0 0 0 160 224h48a8 8 0 0 0 6.75-12.29M164.39 208L62.57 48h29l101.86 160Z"
        ></path>
      </svg>
    {:else}
      <Icon icon={resolveNodeIcon(contentType)} size={Size.sm} />
    {/if}
  </span>
  {text}
</p>
