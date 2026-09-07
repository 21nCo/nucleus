<script lang="ts">
  import { fileDrop } from "@nucleum/actions/fileDrop.action";
  import { popover } from "@nucleum/actions/popover.action";
  import Button from "@21n/elements/button/Button.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import InlineErrorMessage from "@21n/elements/text/InlineErrorMessage.svelte";
  import AudioCapture from "@nucleum/features/memory/capture/AudioCapture.svelte";
  import { MAX_FILE_SIZE_MB } from "@nucleum/application/record/record.store";
  import { resolveFileUploadErrorMessage } from "@nucleum/features/memory/capture/upload-error.utils";
  import {
    mediaNodeTypeList,
    NodeType,
    webNodeTypeList
  } from "@nucleum/features/memory/node/node.type";
  import context from "@nucleum/stores/context.store";
  import { ColorStrength } from "@21n/types/appearance.type";
  import {
    ButtonStyle,
    ButtonVariant,
    type IButtonParams
  } from "@21n/types/button.type";
  import { Embed } from "@21n/types/context.type";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { enumToString } from "@21n/shared-utils/text.utils";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import EmbedLibrarySearch from "@nucleum/features/memory/markdown/embed/EmbedLibrarySearch.svelte";
  import { getContext } from "svelte";
  import view from "@nucleum/stores/view.store";
  import {
    ActiveCaptureStore,
    type IActiveCaptureStore
  } from "@nucleum/features/memory/capture/capture.store";
  import { Context } from "@21n/types/appStore.type";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { Resource } from "@nucleum/datafn/resource.enum";
  const nodeContext = getContext<any>(Context.NODE);
  const captureContext = getContext<any>(Context.CAPTURE);
  const captureStore = $derived.by<IActiveCaptureStore | undefined>(() => {
    if (!nodeContext?.id && !captureContext?.id) return undefined;
    const id = nodeContext?.id
      ? nodeContext?.id + "capture"
      : captureContext?.id;
    return ActiveCaptureStore.resolve(id);
  });
  let {
    linkInputValue = $bindable(""),
    subType,
    onLinkInput = undefined,
    onSelect = undefined
  }: {
    linkInputValue?: string;
    subType?: NodeType | undefined;
    onLinkInput?: ((event: CustomEvent<string>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let librarySearchPopoverRef: HTMLElement | undefined = undefined;
  const commonButtonParams: IButtonParams = {
    size: Size.sm,
    style: ButtonStyle.OUTLINED
  };

  const libraryOnlyTypesTemporary = [
    NodeType.TWEET,
    NodeType.TWITTER_PROFILE,
    NodeType.KINDLE_BOOK,
    NodeType.KINDLE_HIGHLIGHT,
    NodeType.WEB_TEXT_BOOKMARK
  ];

  const nonUploadTypes = [
    NodeType.TREE_OF_LINKS,
    NodeType.CALENDAR_AS_EMBED,
    NodeType.COLLECTION_AS_EMBED,
    NodeType.TOC,
    NodeType.GRAPH_AS_EMBED,
    NodeType.TASK_AS_EMBED
  ];

  const embedIcons = [
    "simple-icons:wikipedia",
    "logos:youtube-icon",
    "logos:figma",
    "logos:replit-icon",
    "github-logo",
    "logos:gitlab",
    "logos:google-maps",
    "logos:google-drive",
    "logos:typeform-icon"
  ];
  const youtubeNodeTypes = [
    NodeType.YOUTUBE_VIDEO,
    NodeType.YOUTUBE_SHORT,
    NodeType.YOUTUBE_CHANNEL
  ];

  let error = $state<string | undefined>(undefined);
  let isSaveInProgress = $state(false);
  let isAudioCaptureInProgress = $state(false);
  let ref: HTMLElement | undefined = undefined;

  const label = $derived(subType ? resolveLabel(subType) : undefined);

  function emitSelect(item: any) {
    const selectEvent = new CustomEvent<any>("select", {
      detail: item
    });
    onSelect?.(selectEvent);
  }

  function emitLinkInput() {
    const linkInputEvent = new CustomEvent<string>("linkInput", {
      detail: linkInputValue
    });
    onLinkInput?.(linkInputEvent);
  }

  function resolveLabel(subType: NodeType) {
    if (nonUploadTypes.includes(subType)) {
      if (subType === NodeType.TREE_OF_LINKS) return "Node links tree";
      if (subType === NodeType.CALENDAR_AS_EMBED) return "Embed calendar";
      if (subType === NodeType.COLLECTION_AS_EMBED) return "Embed collection";
      if (subType === NodeType.TASK_AS_EMBED) return "Add task";
      if (subType === NodeType.TOC) return "Embed table of contents";
      if (subType === NodeType.GRAPH_AS_EMBED) return "Embed graph";
    }
    return enumToString(subType);
  }

  function onSelectFromLibrary(event: CustomEvent) {
    if (event.detail.item) emitSelect(event.detail.item);
  }

  async function handleDrop(
    all: File[],
    valid: File[],
    errors: { file: File; type: string }[]
  ) {
    console.log({
      at: "EmbedContentPlaceholder - handleDrop",
      all,
      valid,
      errors
    });
    try {
      error = undefined;
      if (errors && errors.length > 0) {
        error = resolveFileUploadErrorMessage(errors, {
          maxFileSizeMB: MAX_FILE_SIZE_MB
        });
        return;
      }
      if (all.length === 1) {
        isSaveInProgress = true;
        let file = all[0];
        const result = await captureStore?.saveFile(file, undefined, {
          isEmbedContext: true,
          creationContext: nodeContext?.id ?? undefined
        });
        if (result) emitSelect(result);
      } else if (all.length > 1) {
        error = "Multiple files are not supported";
      }
    } catch (e) {
      logger.error({ at: "EmbedContentPlaceholder - handleDrop", error: e });
      error = "Something went wrong";
    } finally {
      isSaveInProgress = false;
    }
  }

  function resoveFileUploadAcceptedFormats() {
    if (!subType) return "*";
    switch (subType) {
      case NodeType.IMAGE:
        return ".jpg,.png,.jpeg,.svg";
      case NodeType.AUDIO:
        return ".wav,.mp3,.m4a,.aac,.flac,.webm";
      case NodeType.PDF:
        return ".pdf";
      case NodeType.VIDEO:
        return ".mp4,.mov,.webm,.ogg";
      default:
        return "*";
    }
  }

  function onAudioCaptureSave(node: any) {
    isAudioCaptureInProgress = false;
    emitSelect(node);
  }

  async function onCreateNewTask() {
    const task = {
      id: generateResourceId(Resource.task),
      label: "",
      isChecked: false,
      dateUnix: 0,
      objectiveId: ""
    };
    await datafn.task.mutate({
      operation: "insert",
      id: task.id,
      record: task,
      context: ResourceAccessPoint.MARKDOWN_EMBED
    });
    emitSelect(task);
  }
</script>

{#if isAudioCaptureInProgress}
  <div
    class="flex items-center justify-center w-full mo:h-52 h-60 py-2 border border-brs3 rounded-md border-dashed placeholder"
  >
    {#if isSaveInProgress}
      <div class="flex items-center justify-center w-full h-full">
        <Icon icon="svg-spinners:3-dots-fade" size={Size.xl} />
      </div>
    {:else if captureStore}
      <AudioCapture
        {captureStore}
        accessPoint={ResourceAccessPoint.MARKDOWN_EMBED}
        creationContext={nodeContext?.id}
        onSaved={onAudioCaptureSave}
        onClear={() => (isAudioCaptureInProgress = false)}
      />
    {/if}
  </div>
{:else}
  <div
    class={cn(
      "flex flex-col items-center justify-center w-full bg-bgs2 bg-opacity-70 rounded-md border border-dashed border-brs3 placeholder",
      {
        "mo:h-40 h-52": subType,
        "mo:h-60 h-72": !subType
      }
    )}
    data-subtype={subType}
    bind:this={ref}
    use:fileDrop={{
      accept: resoveFileUploadAcceptedFormats(),
      multiple: false,
      isPreventClickToBrowse: true,
      maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
      onDrop: handleDrop,
      dragOverClass: ["bg-opacity-100", "border-fgs3"]
    }}
  >
    {#if isSaveInProgress}
      <div class="flex items-center justify-center w-full h-full">
        <Icon icon="svg-spinners:3-dots-fade" size={Size.xl} />
      </div>
    {:else}
      <div class="flex flex-col items-center mo:gap-3 gap-4 w-full">
        <span class="flex items-center justify-center gap-2">
          {#if subType === NodeType.IMAGE}
            <Icon icon="image" class="stroke-fgs3" />
          {:else if subType === NodeType.AUDIO}
            <Icon icon="music-note" class="stroke-fgs3" />
          {:else if subType === NodeType.FILE}
            <Icon icon="file" class="stroke-fgs3" />
          {:else if subType === NodeType.PDF}
            <Icon icon="file-pdf" class="stroke-fgs3" />
          {:else if subType === NodeType.TWEET || subType === NodeType.TWITTER_PROFILE}
            <Icon icon="twitter" class="stroke-fgs3" />
          {:else if subType === NodeType.KINDLE_BOOK || subType === NodeType.KINDLE_HIGHLIGHT}
            <Icon icon="book" class="stroke-fgs3" />
          {:else if subType && youtubeNodeTypes.includes(subType)}
            <Icon icon="youtube" class="stroke-fgs3" />
          {:else if !subType}
            <div class="flex items-center justify-center gap-3">
              {#each embedIcons as icon}
                <Icon {icon} class="stroke-fgs3" size={Size.sm} />
              {/each}
              <span class="text-b3"> & more... </span>
            </div>
          {/if}
          {#if label}
            <span class="text-fgs2 text-b2">{label}</span>
          {/if}
        </span>
        {#if subType && mediaNodeTypeList.includes(subType)}
          <span class="text-fgs2 text-b2">
            {#if $context.embed !== Embed.HANDSET}
              Drag and drop your {label ?? "files"} here
            {/if}
          </span>
        {/if}
        {#if (subType && webNodeTypeList.includes(subType) && !libraryOnlyTypesTemporary.includes(subType)) || !subType}
          <div
            class="flex justify-center items-center gap-3 mo:w-full w-3/4"
            onclick={(event) => {
              event.stopPropagation();
            }}
          >
            <TextInput
              bind:value={linkInputValue}
              icon="globe"
              placeholder="Type or paste embed code/link here"
            />
            <Button
              label={$view.isConstrainedWidth ? "" : "Go"}
              icon="proceed"
              type={ButtonVariant.PRIMARY}
              style={ButtonStyle.OUTLINED}
              onclick={emitLinkInput}
            />
          </div>
        {/if}
        {#if $context.embed !== Embed.HANDSET && ((subType && ![...libraryOnlyTypesTemporary, ...nonUploadTypes].includes(subType)) || !subType)}
          <div class="w-1/3">
            <Divider text="or" colorStrength={ColorStrength.Strong} />
          </div>
        {/if}
        <div class="flex items-center justify-center gap-3 w-full">
          {#if (subType && mediaNodeTypeList.includes(subType)) || !subType}
            {#if subType === NodeType.IMAGE && $context.embed === Embed.HANDSET}
              <!-- <Button
                label="Capture"
                icon="camera"
                {...commonButtonParams}
                type={ButtonVariant.PRIMARY}
              /> -->
            {:else if subType === NodeType.AUDIO}
              <Button
                label={$view.isConstrainedWidth ? "" : "Record"}
                icon="microphone"
                {...commonButtonParams}
                type={ButtonVariant.PRIMARY}
                onclick={() => (isAudioCaptureInProgress = true)}
              />
            {/if}
            <Button
              label={$view.isConstrainedWidth && subType === NodeType.AUDIO
                ? ""
                : "Upload"}
              icon="upload"
              {...commonButtonParams}
              type={ButtonVariant.PRIMARY}
              onclick={() => {
                ref?.dispatchEvent(new CustomEvent("browse"));
              }}
            />
          {/if}
          {#if subType === NodeType.TASK_AS_EMBED}
            <Button
              label="Create new task"
              icon="plus"
              {...commonButtonParams}
              type={ButtonVariant.PRIMARY}
              onclick={onCreateNewTask}
            />
          {/if}
          <div
            onclick={(event) => {
              event.stopPropagation();
            }}
            bind:this={librarySearchPopoverRef}
            use:popover={{
              content: EmbedLibrarySearch,
              componentProps: {
                subType,
                onSelect: onSelectFromLibrary,
                onReset: () => {
                  librarySearchPopoverRef?.dispatchEvent(
                    new CustomEvent("hide")
                  );
                }
              }
            }}
          >
            <Button
              label="Choose from library"
              icon="library"
              {...commonButtonParams}
            />
          </div>
        </div>
        {#if subType && [...libraryOnlyTypesTemporary].includes(subType)}
          <span class="text-fgs2 text-b2">
            Note: Only saved {label}s from library can be embedded at the
            moment.
          </span>
        {/if}
        {#if error}
          <InlineErrorMessage {error} />
        {/if}
      </div>
    {/if}
  </div>
{/if}
