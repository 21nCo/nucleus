<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import {
    feedbackPane,
    webpage
  } from "@nucleum/extensions/clipper/contentScripts/store";
  import { AlertType } from "@nucleum/stores/notifications/notification.type";
  import type { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import { enumToString } from "@21n/shared-utils/text.utils";
  let {
    contentType,
    class: classList = undefined,
    isHideLabel = false
  }: {
    contentType: NodeType;
    class?: string | undefined;
    isHideLabel?: boolean;
  } = $props();
  let isSaving: boolean = false;
  let contentTypeStr = $derived(enumToString(contentType));
  let isSaved = $derived(!!$webpage.id);

  async function onClick(e: MouseEvent) {
    try {
      if (isSaving) return;
      feedbackPane.onPageSaveStart(`Saving ${contentTypeStr}...`);
      isSaving = true;
      if (isSaved) {
        feedbackPane.onPageSaved(
          `${contentTypeStr} already saved!`,
          AlertType.SUCCESS
        );
        isSaving = false;
        return;
      }
      await webpage.savePage({ contentType });
      feedbackPane.onPageSaved(`${contentTypeStr} saved!`);
    } catch (err) {
      logger.error(`Error saving ${contentTypeStr}`, err);
    } finally {
      isSaving = false;
    }
  }
</script>

<button
  class={cn(
    "flex items-center justify-center whitespace-nowrap gap-2 text-b2 hover:text-aps1 hover:border-aps1 px-2 min-h-[2rem] hover:bg-aps3 group",
    {
      "rounded-full mr-2": !classList,
      "border border-dashed border-fgs4": !isSaved && !isSaving,
      "border-[1.5px] border-brs3": isSaved || isSaving
    },
    classList
  )}
  onclick={onClick}
  disabled={isSaving}
>
  <Icon
    icon={isSaving
      ? "svg-spinners:3-dots-fade"
      : isSaved
        ? "mynaui:check-hexagon"
        : "mynaui:plus-hexagon"}
    isFilled={isSaved}
    class="group-hover:text-aps1"
  />
  {#if !isHideLabel}
    <span>{isSaved ? "Saved to Memotron" : "Save to Memotron"}</span>
  {/if}
</button>
