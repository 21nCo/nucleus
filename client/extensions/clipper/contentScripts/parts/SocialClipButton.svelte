<script lang="ts">
  import { Placement } from "@21n/elements/direction.enum";
  import { Size } from "@21n/elements/size.enum";
  import HoverableElement from "@21n/elements/HoverableElement.svelte";
  import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { webpage } from "@nucleum/extensions/clipper/contentScripts/store";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { AlertType } from "@nucleum/stores/notifications/notification.type";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle } from "@21n/elements/button/button.type";

  let {
    contentType,
    size = Size.md,
    label = undefined
  }: {
    contentType: NodeType;
    size?: Size.sm | Size.md | Size.lg;
    label?: string | undefined;
  } = $props();

  let id: string | undefined = undefined;
  let isSaving: boolean = false;
  let tooltipSaved: string = "Saved to Memotron";
  let tooltipSaving: string = "Saving...";
  let tooltipDefault: string = "Save to Memotron";
  let classList: string = "";
  export { classList as class };

  function resolveTooltip(isSaving: boolean, id: string | undefined) {
    if (isSaving && id) return "Reparsing...";
    if (isSaving) return tooltipSaving;
    if (id) return tooltipSaved;
    if (label) return "";
    return tooltipDefault;
  }

  async function onClick(e: MouseEvent) {
    try {
      e.stopPropagation();
      const target = e.target as HTMLElement | undefined;
      if (isSaving || !target) return;
      isSaving = true;
      if (id) {
        webpage.focus(id, {
          message: `${enumToString(contentType)} already saved!`,
          type: AlertType.SUCCESS
        });
        isSaving = false;
        return;
      }
      const result = await webpage.saveInlineSocialPost(target, contentType);
      if (result) {
        id = result.id;
      }
    } catch (err) {
      logger.error(`Error saving ${enumToString(contentType)} post`, err);
    } finally {
      isSaving = false;
    }
  }
</script>

<div data-type="clip-button" class={classList}>
  <HoverableElement
    tooltip={resolveTooltip(isSaving, id)}
    tooltipOptions={{
      isUseAbsolutePositioning: true,
      placement: Placement.TopCenter
    }}
    class="relative flex justify-center items-center"
  >
    <Button
      icon={isSaving
        ? "svg-spinners:3-dots-fade"
        : id
          ? "mynaui:check-hexagon-solid"
          : "mynaui:plus-hexagon"}
      style={label ? ButtonStyle.OUTLINED : ButtonStyle.PLAIN}
      {size}
      onclick={onClick}
      {label}
    />
  </HoverableElement>
</div>
