<script lang="ts">
  import { cn } from "@21n/utils/ui.utils";
  import {
    isSameResource,
    resourceInList
  } from "@nucleum/datafn/resource.utils";
  import { tooltip } from "@nucleum/actions/popover.action";

  let {
    headingBlocks,
    mdStore,
    scrollToHeading,
    dev_isShowFocusState = false
  }: {
    headingBlocks: any[];
    mdStore: any;
    scrollToHeading: (e: MouseEvent, id: string) => void;
    dev_isShowFocusState?: boolean;
  } = $props();
</script>

{#each headingBlocks as block}
  {@const isInView = $mdStore?.headingsInView?.some(resourceInList(block))}
  {@const isFirstInView =
    $mdStore?.headingsInView?.[0] &&
    isSameResource($mdStore.headingsInView[0], block)}
  {@const isLastInView =
    $mdStore?.headingsInView?.[$mdStore?.headingsInView?.length - 1] &&
    isSameResource(
      $mdStore.headingsInView[$mdStore.headingsInView.length - 1],
      block
    )}
  {@const isActive =
    dev_isShowFocusState &&
    $mdStore.activeHeading &&
    isSameResource($mdStore.activeHeading, block)}
  <a
    href="#{block.id}"
    onclick={(e) => scrollToHeading(e, block.id)}
    class={cn(
      "flex items-center gap-1 text-b2 truncate py-1.5",
      {
        "hover:bg-bgs2 rounded-md": !isInView,
        "bg-bgs2": isInView,
        "rounded-t-md": isFirstInView,
        "rounded-b-md": isLastInView,
        "text-aps1": isActive && !$mdStore.params?.isReadOnly
      },
      (!isActive || $mdStore.params?.isReadOnly) && {
        "text-fgs1": isInView,
        "text-fgs3": !isInView
      }
    )}
    style="padding-left: {block.HEADING > 0 ? block.HEADING * 20 : 4}px;"
    use:tooltip={{
      isEnableOnlyOnTruncate: true,
      text: block.content
    }}
  >
    <span
      class={cn(
        "bg-aps1 min-w-1.5 h-1.5 flex justify-center items-center rounded-full",
        {
          "opacity-0": !isActive || $mdStore.params?.isReadOnly
        }
      )}
    >
    </span>
    <span>
      {block.content}
    </span>
  </a>
{/each}
