<script lang="ts">
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  import { type INode, NodeType } from "@nucleum/features/memory/node/node.type";
  import { cn, convertToRGBA } from "@21n/utils/ui.utils";
  import { truncateString } from "@21n/shared-utils/text.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle } from "@21n/types/button.type";
  import { Size } from "@21n/types/size.enum";
  import { toasts } from "@nucleum/stores/notification.store";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import {
    Preference,
    PreferencesScope
  } from "@nucleum/stores/preferences/preferences.type";
  import { appStore } from "@nucleum/stores/app.store";
  import { derived } from "svelte/store";
  import { Arrangement } from "@21n/types/direction.enum";
  let {
    node,
    contentPreview,
    truncateLength = undefined,
    accessPoint = ResourceAccessPoint.SELF,
    arrangement = Arrangement.LIST
  }: {
    node: INode;
    contentPreview: string;
    truncateLength?: number | undefined;
    accessPoint?: ResourceAccessPoint;
    arrangement?: Arrangement;
  } = $props();

  const hideHighlightColors = derived(
    [preferences, appStore],
    ([$preferences, $appStore]) => {
      const key = `${$appStore.product}-${Preference.HIDE_HIGHLIGHT_COLORS}`;
      return ($preferences[key] as boolean) ?? false;
    }
  );

  let textHightlightColor = $derived(
    $hideHighlightColors ? undefined : resolveTextHighlightColor(node)
  );

  function getKindleHighlightRGBA(color: string, opacity: number) {
    const colorMap: Record<string, string> = {
      blue: "0, 0, 255",
      green: "0, 255, 0",
      yellow: "255, 255, 0",
      orange: "255, 128, 0",
      pink: "255, 0, 255"
    };
    return `rgba(${colorMap[color]}, ${opacity})`;
  }

  function resolveTextHighlightColor(item: any) {
    if (
      item.contentType === NodeType.WEB_TEXT_BOOKMARK &&
      item.body.highlighterId
    ) {
      const color = $highlightStore?.highlighters?.find(
        (x) => x.id === item.body.highlighterId
      )?.color;
      return color ? convertToRGBA(color, 0.4) : undefined;
    } else if (
      item.contentType === NodeType.KINDLE_HIGHLIGHT &&
      item.body.color
    ) {
      return getKindleHighlightRGBA(item.body.color, 0.3);
    } else {
      return undefined;
    }
  }

  async function copyTextContent() {
    const text = node.text || node.mdText || contentPreview || "";
    if (text) {
      await navigator.clipboard.writeText(text);
      toasts.success("Text copied to clipboard");
    }
  }
</script>

<div class="flex flex-col gap-2">
  <div
    class={cn("rounded-md text-wrap text-left userdata selectable", {
      "m-4 p-4 bg--bgs2": accessPoint === ResourceAccessPoint.SELF,
      "line-clamp-3":
        accessPoint !== ResourceAccessPoint.SELF &&
        accessPoint !== ResourceAccessPoint.NODE_TRACES &&
        arrangement === Arrangement.LIST,
      "line-clamp-5": accessPoint === ResourceAccessPoint.NODE_TRACES
    })}
  >
    <span
      class={cn("relative", {
        "text-b2": accessPoint === ResourceAccessPoint.SELF,
        "text-fgs3":
          accessPoint !== ResourceAccessPoint.SELF &&
          !textHightlightColor &&
          arrangement !== Arrangement.LIST
      })}
      style="background-color: {textHightlightColor
        ? textHightlightColor
        : 'transparent'};"
    >
      {truncateString(contentPreview, truncateLength)}
    </span>
  </div>
  {#if accessPoint === ResourceAccessPoint.SELF}
    <div class="flex justify-center items-center w-full gap-4 pb-4">
      <Button
        style={ButtonStyle.PLAIN}
        label="Copy text content"
        isUnderlined={true}
        size={Size.sm}
        onclick={copyTextContent}
      />
    </div>
  {/if}
</div>
