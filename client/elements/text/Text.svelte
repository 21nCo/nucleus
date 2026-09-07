<script lang="ts">
  import appearance from "@nucleum/stores/appearance.store";
  import view from "@nucleum/stores/view.store";
  import { TextStyle } from "@21n/types/text.enum";
  import { properCase } from "@21n/shared-utils/text.utils";
  import MarkdownRenderer from "@21n/elements/text/MarkdownRenderer.svelte";
  import { onMount } from "svelte";
  let {
    content,
    style,
    customStyle = "",
    width = "",
    isPreventProperCasing = false
  }: {
    content: string;
    style: TextStyle;
    customStyle?: string;
    width?: string;
    isPreventProperCasing?: boolean;
  } = $props();

  let classList: string = $state("");
  onMount(() => {
    switch (style) {
      case TextStyle.PAGE_HEADING:
        classList +=
          ($view.isPortrait ? "text-h2" : "text-h1") +
          "  bg-none font-medium" +
          (!$appearance.colorScheme.isActiveFgFg ? " text-aps1" : "");
        break;
      case TextStyle.PAGE_HEADING_SUBTLE:
        classList +=
          ($view.isPortrait ? "text-h2" : "text-h1") +
          "  bg-none font-medium text-fgs2 opacity-40";
        break;
      case TextStyle.PANEL_HEADING:
        classList += " text-h3 font-medium text-fgs2 bg-none ";
        break;
      case TextStyle.PANEL_HEADING_SMALL:
        classList += " text-h4 font-medium text-fgs2 bg-none ";
        break;
      case TextStyle.SECTION_DESCRIPTION:
        classList += " text-fgs3";
        break;
      case TextStyle.SECTION_HEADING:
        classList += " text-fgs3 font-light text-b2 max-w-3xl bg-none";
        break;
      case TextStyle.SECTION_HEADING_SMALL:
        classList += " text-fgs3 font-light text-b3 max-w-3xl bg-none";
        break;
      case TextStyle.FORM_LABEL:
        classList += " text-fgs2 font-medium text-b3 max-w-3xl bg-none";
        break;
    }
    classList += ` ${width} `;
  });
</script>

<div style={customStyle} class={`${classList}`}>
  <MarkdownRenderer
    text={!isPreventProperCasing ? properCase(content) : content}
  />
</div>
