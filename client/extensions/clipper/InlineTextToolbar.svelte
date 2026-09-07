<script lang="ts">
  import { onMount } from "svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import LinkBoxOnClipper from "@nucleum/features/memory/common/linkbox/LinkBoxOnClipper.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import LinkItems from "@nucleum/features/memory/common/linkbox/LinkItems.svelte";
  import { webpage } from "@nucleum/extensions/clipper/contentScripts/store";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { AlertType } from "@21n/types/notification.type";
  import InlineMarkdownTextInput from "@nucleum/features/memory/markdown/content/InlineMarkdownTextInput.svelte";
  import LinkActionOnClipper from "@nucleum/features/memory/common/linkbox/LinkActionOnClipper.svelte";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import HighlightColors from "@nucleum/features/memory/common/highlighters/HighlightColors.svelte";
  import { debouncer } from "@21n/utils/utils";
  import { determineResourceType } from "@nucleum/datafn/resource.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { ResourceError } from "@nucleum/application/error/errors";
  import { ButtonVariant } from "@21n/types/button.type";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { Size } from "@21n/types/size.enum";
  import { Orientation } from "@21n/types/direction.enum";
  import { cn } from "@21n/utils/ui.utils";
  let {
    id = null,
    selectedHighlighterId = $bindable(null),
    feedback = $bindable(""),
    onColor = undefined
  }: {
    id?: string | null;
    selectedHighlighterId?: string | null;
    feedback?: { message: string; type: AlertType } | string;
    onColor?: ((highlighter: any) => void) | undefined;
  } = $props();
  let isLinkboxOpened = false;
  let isNotesOpened = false;
  let clip: any;
  let notes: string = "";
  $effect(() => {
    if (id) refreshClip(id, $webpage.clips);
  });
  function refreshClip(id: string, clips: any[] | undefined = undefined) {
    if (!clips) {
      clips = $webpage.clips;
    }
    clip = clips?.find((c) => c.id.toString() === id.toString());
    notes = clip?.notes ?? "";
  }

  onMount(() => {
    feedback = "";
    if (id) refreshClip(id, $webpage.clips);
  });

  async function onNotesChange(e: CustomEvent) {
    feedback = { message: "Saving...", type: AlertType.PROGRESS };
    logger.log({ at: "onNotesChange", id, notes });
    const response = await webpage.persistClipNotes(id, notes);
    if (!response) {
      feedback = { message: "Notes save failed", type: AlertType.ERROR };
    } else {
      feedback = { message: "Notes saved!", type: AlertType.SUCCESS };
    }
  }

  const debouncedNotesChange = debouncer(onNotesChange, 1500);

  async function onPropertyUpdate(e: CustomEvent) {
    try {
      if (!e.detail || !e.detail?.id || e.detail?.value === undefined || !id)
        return;
      feedback = {
        message: "Syncing changes...",
        type: AlertType.PROGRESS
      };
      let result = await webpage.updateClipProperty(id, {
        id: e.detail.id,
        value: e.detail.value
      });
      if (!result) {
        feedback = {
          message: "Property update failed",
          type: AlertType.ERROR
        };
        return;
      }
      feedback = {
        message: "Synced!",
        type: AlertType.SUCCESS
      };
    } catch (error) {
      let errMessage = "Property update failed";
      if (error instanceof ResourceError) {
        errMessage = error.message;
      }
      feedback = {
        message: errMessage,
        type: AlertType.ERROR
      };
    }
  }

  async function onLink(e: CustomEvent) {
    try {
      if (!e.detail || !id) return;
      const resourceType = determineResourceType(e.detail);
      const feedbackMessage =
        resourceType === Resource.collection
          ? "Adding to collection..."
          : "Linking...";
      feedback = {
        message: feedbackMessage,
        type: AlertType.PROGRESS
      };
      let result = await webpage.linkClip(id, e.detail);
      if (!result) return;
      const successMessage =
        resourceType === Resource.collection
          ? "Added to collection!"
          : "Clip linked!";
      feedback = {
        message: successMessage,
        type: AlertType.SUCCESS
      };
      refreshClip(id);
    } catch (error) {
      let errMessage = "Linking failed";
      if (error instanceof ResourceError) {
        errMessage = error.message;
      }
      feedback = {
        message: errMessage,
        type: AlertType.ERROR
      };
    }
  }
</script>

<div
  class={cn(
    "shadow-md border border-brs2 bg-bgs1 rounded-md flex flex-col justify-center items-center px-4 py-3 gap-3 max-w-fit w-[26rem]",
    {
      "max-h-[20rem]": isNotesOpened
    }
  )}
>
  <div class="flex justify-center items-center gap-3">
    <!-- TODO test colors change from pdf annotator changes -->
    <HighlightColors bind:selected={selectedHighlighterId} {onColor} />
    {#if id}
      <Divider orientation={Orientation.Vertical} />
      <!-- <Button
        icon={isLinkboxOpened ? "link-arrow-down" : "weblink-two"}
        type={isLinkboxOpened ? ButtonVariant.PRIMARY : ButtonVariant.SECONDARY}
        label="link"
        size={Size.xs}
      /> -->
      <LinkActionOnClipper links={clip?.links} bind:isLinkboxOpened />
      <Toggle
        icon={notes ? "note" : "note-blank"}
        tooltip={notes ? "View notes" : "Add notes"}
        bind:on={isNotesOpened}
        bgSize={Size.sm}
        onChange={(e) => {
          if (e.detail) isLinkboxOpened = false;
        }}
      />
      <Button
        icon="trash"
        tooltip="Delete clip"
        type={ButtonVariant.DANGER}
        onclick={async () => {
          let result = await webpage.removeClip(id);
          feedback = result?.message
            ? result
            : { message: "Clip removal failed", type: AlertType.ERROR };
        }}
      />
    {/if}
  </div>
  {#if isLinkboxOpened}
    <LinkBoxOnClipper {onLink} />
    <LinkItems
      links={clip?.links}
      isWrapItems={true}
      nodeId={id}
      propertyValues={clip?.propertyValues}
      onPropertyChange={onPropertyUpdate}
      isExpandable={true}
      onUnlink={async (e) => {
        feedback = "Removing link...";
        let result;
        if (e.detail) result = await webpage.removeLinkForClip(id, e.detail);
        feedback = result?.message
          ? result
          : { message: "Unlinking failed", type: AlertType.ERROR };
        refreshClip(id);
      }}
    />
  {/if}
  {#if isNotesOpened}
    <div class="w-full overflow-y-auto">
      <InlineMarkdownTextInput
        placeholder="Add notes"
        bind:content={notes}
        onChange={debouncedNotesChange}
      />
    </div>
  {/if}
  {#if feedback}
    <InlineFeedbackText bind:feedback isRenderEmptyHeight={true} />
  {/if}
</div>
