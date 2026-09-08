<script lang="ts">
  import { resolveNodeContextMenu } from "@nucleum/features/memory/node/node.store";
  import type { Snippet } from "svelte";
  import { Arrangement } from "@21n/elements/direction.enum";
  import {
    headingNodeTypes,
    type INode,
    type INodeThumb,
    NodeType,
    socialPostNodeTypeList,
    socialProfileNodeTypeList,
    socialProfileWithImageUnavailable
  } from "@nucleum/features/memory/node/node.type";
  import {
    resolveContentPreview,
    resolveFilePreview,
    resolveIfImageShouldContain,
    resolveUrlPreview
  } from "@nucleum/features/memory/node/node.utils";
  import ResourceGridThumbnail from "@nucleum/components/records/ResourceGridThumbnail.svelte";
  import ResourceThumbnailBase from "@nucleum/components/records/ResourceThumbnailBase.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { Size } from "@21n/elements/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import NodeThumbnailTitle from "@nucleum/features/memory/node/thumbnail/NodeThumbnailTitle.svelte";
  import TextClipPreview from "@nucleum/features/memory/node/content/web/TextClipPreview.svelte";
  import FileView from "@nucleum/features/files/FileView.svelte";
  import {
    formatDatetime,
    formatSeconds,
    formatTime
  } from "@21n/utils/time.utils";
  import { userPreferences } from "@nucleum/stores/preferences/user-preferences.store";
  import NodeThumbnailAudioPreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailAudioPreview.svelte";
  import NodeThumbnailPdfPreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailPdfPreview.svelte";
  import { TimeFormat } from "@21n/utils/time.type";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import { fileStore } from "@nucleum/features/files/file.store";
  import type { IFile } from "@nucleum/features/files/file.type";
  import { renderMdAsHtml } from "@21n/elements/markdown/markdown.utils";
  import CollectionItemThumbnailProperties from "@nucleum/features/collections/properties/CollectionItemThumbnailProperties.svelte";
  import type { IProperty } from "@nucleum/features/collections/properties/property.type";
  import { enumToString, isValidString } from "@21n/shared-utils/text.utils";
  import ImagePreview from "@nucleum/features/memory/node/content/ImagePreview.svelte";
  import NodeThumbnailTwitterProfilePreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailTwitterProfilePreview.svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import NodeThumbnailSocialPostPreview from "@nucleum/features/memory/node/thumbnail/NodeThumbnailSocialPostPreview.svelte";
  import CoverRenderer from "@21n/elements/coverPicker/CoverRenderer.svelte";
  let {
    item: itemProp,
    arrangement = Arrangement.LIST,
    isHidePreview = false,
    isHideTitle = false,
    visibleProps = [],
    size = Size.md,
    accessPoint = ResourceAccessPoint.BROWSER,
    accessPointContext = undefined,
    accessPointId,
    collectionContext = undefined,
    isApplyCustomColor = false,
    parentBgIndex = 1,
    isDraggable = false,
    refreshId = new Date().getTime(),
    isAlwaysShowContextMenuOnTouchDevice = false,
    onAction = undefined,
    onClick = undefined,
    onLoad = undefined,
    right: rightContent = undefined,
    bottom: bottomContent = undefined
  }: {
    item: INode | INodeThumb;
    arrangement?: Arrangement;
    isHidePreview?: boolean;
    isHideTitle?: boolean;
    visibleProps?: IProperty[];
    size?: Size.sm | Size.md;
    accessPoint?: ResourceAccessPoint;
    accessPointContext?: string | undefined;
    accessPointId: IRecordId;
    collectionContext?: "board" | "default" | undefined;
    isApplyCustomColor?: boolean;
    parentBgIndex?: number;
    isDraggable?: boolean;
    refreshId?: number;
    isAlwaysShowContextMenuOnTouchDevice?: boolean;
    onAction?: ((event: CustomEvent<any>) => void) | undefined;
    onClick?: ((event: MouseEvent) => void) | undefined;
    onLoad?: ((event: CustomEvent<Event>) => void) | undefined;
    right?: Snippet | undefined;
    bottom?: Snippet | undefined;
  } = $props();
  let item = $state<INode | INodeThumb>(itemProp);

  let _url = $state<string | undefined>(undefined);
  let filePreview = $derived(
    resolveFilePreview(item) as IFile | IRecordId | undefined
  );
  let hasFullFileDetails = $derived(
    !!filePreview && typeof filePreview === "object"
  );
  let resolvedFilePreview = $derived(
    hasFullFileDetails ? (filePreview as IFile) : undefined
  );
  let resolvedFilePreviewId = $derived(
    typeof filePreview === "string" ? filePreview : undefined
  );
  let urlPreview = $derived(resolveUrlPreview(item));
  let contentPreview = $derived(resolveContentPreview(item));
  let youtubeTimestamp = $derived(
    item.contentType === NodeType.YOUTUBE_BOOKMARK &&
      item.body &&
      typeof item.body !== "string" &&
      "timestamp" in item.body &&
      typeof item.body.timestamp === "number"
      ? item.body.timestamp
      : undefined
  );
  let isTextClip = $derived(
    item.contentType === NodeType.WEB_TEXT_BOOKMARK ||
      item.contentType === NodeType.KINDLE_HIGHLIGHT
  );
  let isFullExpand = $derived(
    isTextClip ||
      socialPostNodeTypeList.has(item.contentType) ||
      (accessPoint === ResourceAccessPoint.NODE_TRACES &&
        item.contentType !== NodeType.YOUTUBE_BOOKMARK)
  );
  let isShouldContainImage = $derived(
    resolveIfImageShouldContain(item.contentType)
  );
  let isLinkContext = $derived(
    accessPoint === ResourceAccessPoint.NODE_LINKS ||
      accessPoint === ResourceAccessPoint.DEFAULT_RIGHT_PANE_LINKS
  );
  let socialFallbackText = $derived(
    socialPostNodeTypeList.has(item.contentType) &&
      !isValidString(contentPreview)
      ? `Unknown ${enumToString(item.contentType)}`
      : undefined
  );
  let socialPreviewText = $derived(
    socialPostNodeTypeList.has(item.contentType)
      ? isValidString(contentPreview)
        ? contentPreview
        : socialFallbackText
      : undefined
  );

  $effect(() => {
    item = itemProp;
    refreshId = new Date().getTime();
  });

  $effect(() => {
    if (accessPoint !== ResourceAccessPoint.LIBRARY) return;
    if (item.contentType !== NodeType.NODULAR_MARKDOWN) return;
    console.log(
      "NodeThumbnail.libraryItem",
      JSON.stringify({
        id: item.id,
        label: item.label,
        text: item.text,
        bodySearch: item.bodySearch,
        labelSearch: item.labelSearch
      })
    );
  });

  $effect(() => {
    filePreview;
    void resolveUrl();
  });

  async function resolveUrl() {
    if (item?.file) {
      const result = await fileStore.refresh(item.file);
      if (result) _url = result.url ?? "";
      return;
    }
    _url = undefined;
  }

  function propagateClick(event: MouseEvent) {
    onClick?.(event);
  }

  function propagateAction(event: CustomEvent<any>) {
    onAction?.(event);
  }

  function propagateLoad(event: CustomEvent<Event>) {
    onLoad?.(event);
  }

  function propagateDomLoad(event: Event) {
    const loadEvent = new CustomEvent<Event>("load", {
      detail: event
    });
    propagateLoad(loadEvent);
  }
</script>

<ResourceThumbnailBase
  menuResolver={resolveNodeContextMenu}
  {item}
  {accessPoint}
  {accessPointId}
  {accessPointContext}
  {isDraggable}
  {isApplyCustomColor}
  {arrangement}
  {isHidePreview}
  {isAlwaysShowContextMenuOnTouchDevice}
  onAction={propagateAction}
  right={rightContent}
>
  {#if arrangement === Arrangement.LIST}
    <div
      class={cn("relative flex flex-col w-full border rounded-md truncate", {
        "bg-ccs5 notouch:hover:bg-ccs4 active:bg-ccs4 border-ccs2":
          isApplyCustomColor,
        "border-transparent notouch:hover:border-brs3 active:border-brs3 px-1":
          !isApplyCustomColor,
        "bg-bgs2 px-2":
          !isApplyCustomColor &&
          (accessPoint === ResourceAccessPoint.LIBRARY || isLinkContext),
        "pb-2": isLinkContext,
        "pt-2": isLinkContext && (isFullExpand || filePreview || urlPreview)
      })}
    >
      <button
        class={cn(
          "flex w-full items-center border- rounded--md truncate",
          !isFullExpand && {
            "h-16":
              (!isLinkContext || isFullExpand) &&
              (!visibleProps || visibleProps.length === 0)
          }
        )}
        onclick={propagateClick}
      >
        {#if item.cover || item.previewImage || (item.contentType !== NodeType.NODULAR_MARKDOWN && !headingNodeTypes.includes(item.contentType))}
          <div
            class={cn(
              {
                "w-full h-full flex justify-start": isFullExpand
              },
              !isFullExpand && {
                "min-w-10 w-1/10 max-w-1/10": true,
                "h-10": !visibleProps || visibleProps.length === 0,
                "border-r": !isLinkContext && isApplyCustomColor,
                "border-ccs2": isApplyCustomColor
              }
            )}
          >
            {#if item.bodySearch}
              {@html renderMdAsHtml(item.bodySearch)}
            {:else if filePreview}
              <FileView
                file={resolvedFilePreview}
                id={resolvedFilePreviewId}
                isHideControls={true}
                isLazyLoad={true}
                isUseThumbnailIfAvailable={true}
                class="object-cover h-full w-full rounded-md"
              />
            {:else if item.cover}
              <CoverRenderer
                cover={item.cover}
                class={cn("object-cover h-full w-full rounded-md")}
              />
            {:else if urlPreview}
              <ImagePreview
                src={urlPreview}
                {arrangement}
                class="object-cover h-full w-full rounded-md"
              />
            {:else if item.contentType === NodeType.AUDIO && _url}
              <span class="w-full h-full overflow-clip">
                <NodeThumbnailAudioPreview url={_url} />
              </span>
            {:else}
              <div
                class={cn("h-full text-wrap text-left text-b3 overflow-clip", {
                  "p-1 min-h-12":
                    !isLinkContext && (contentPreview || socialPreviewText)
                })}
              >
                {#if socialPreviewText}
                  <NodeThumbnailSocialPostPreview
                    text={socialPreviewText}
                    {accessPoint}
                    contentType={item.contentType}
                  />
                {:else if isTextClip && contentPreview}
                  <TextClipPreview
                    node={item}
                    {contentPreview}
                    {accessPoint}
                    {arrangement}
                  />
                {:else if contentPreview}
                  <span class="text-fgs3 userdata">
                    {@html renderMdAsHtml(contentPreview)}
                  </span>
                {:else}
                  <div
                    class="flex justify-center items-center bg-bgs2 w-full h-full rounded-md"
                  >
                    <Icon icon="file" class="text-fgs3" />
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
        {#if !isFullExpand}
          <div class="flex flex-col gap-2 items-start p-2">
            {#key refreshId}
              <NodeThumbnailTitle
                node={item}
                isUrlOnIcon={true}
                {accessPoint}
              />
            {/key}
            {#if !isLinkContext}
              <div class="text-b4 text-fgs3">
                {#if accessPoint === ResourceAccessPoint.CALENDAR}
                  {formatTime($userPreferences, new Date(item.createdAt))}
                {:else}
                  {formatDatetime($userPreferences, new Date(item.createdAt))}
                {/if}
              </div>
            {/if}
            {#if visibleProps.length > 0 && !isLinkContext}
              <div class="py-1">
                <CollectionItemThumbnailProperties
                  {item}
                  values={item.propertyValues}
                  properties={visibleProps}
                  collectionId={accessPoint === ResourceAccessPoint.COLLECTION
                    ? accessPointId
                    : undefined}
                  {accessPoint}
                />
              </div>
            {/if}
          </div>
        {/if}
      </button>
      {#if item.contentType === NodeType.YOUTUBE_BOOKMARK && accessPoint === ResourceAccessPoint.NODE_TRACES}
        <span
          class={cn(
            "absolute bottom-3 left-3 bg-bgs2 rounded-md px-1 py-0.5 text-b2"
          )}
          style=""
        >
          {formatSeconds(youtubeTimestamp ?? 0, TimeFormat.CLOCK)}
        </span>
      {/if}
      {@render bottomContent?.()}
    </div>
  {:else if arrangement === Arrangement.GRID}
    <ResourceGridThumbnail
      {item}
      onclick={propagateClick}
      {isHidePreview}
      {isApplyCustomColor}
      size={accessPoint === ResourceAccessPoint.BROWSER ? Size.sm : Size.md}
    >
      {#if !isHidePreview}
        <div class="relative flex-1 min-h-0 w-full pt-3 px-3">
          {#if item.bodySearch}
            <span class="text-b2 text-fgs2">
              {@html renderMdAsHtml(item.bodySearch)}
            </span>
          {:else if item.cover}
            <CoverRenderer
              cover={item.cover}
              class="absolute inset-0 w-full rounded-t-md object-cover h-full"
            />
          {:else if filePreview}
            <FileView
              file={resolvedFilePreview}
              id={resolvedFilePreviewId}
              isLazyLoad={true}
              isHideControls={true}
              isUseThumbnailIfAvailable={true}
              isApplyBgColor={false}
              class="absolute inset-0 w-full rounded-t-md object-cover h-full"
            />
          {:else if urlPreview && socialProfileNodeTypeList.has(item.contentType) && !socialProfileWithImageUnavailable.has(item.contentType)}
            <NodeThumbnailTwitterProfilePreview src={urlPreview} />
          {:else if urlPreview}
            <ImagePreview
              src={urlPreview}
              {arrangement}
              isApplyBgColor={isShouldContainImage}
              class={cn("absolute inset-0 w-full h-full", {
                "object-contain": isShouldContainImage,
                "rounded-t-md object-cover": !isShouldContainImage
              })}
            />
          {:else if item.contentType === NodeType.PDF && _url}
            <NodeThumbnailPdfPreview url={_url} />
          {:else}
            <div class="h-full overflow-clip text-b2">
              {#if isTextClip && contentPreview}
                <TextClipPreview
                  node={item}
                  {contentPreview}
                  {accessPoint}
                  {arrangement}
                />
              {:else if item.contentType === NodeType.AUDIO && _url}
                <NodeThumbnailAudioPreview url={_url} />
              {:else if contentPreview}
                <div class="text-fgs3 text-left userdata">
                  {@html renderMdAsHtml(contentPreview)}
                </div>
              {/if}
            </div>
          {/if}
          {#if !filePreview && contentPreview && !socialProfileNodeTypeList.has(item.contentType)}
            <span
              class={cn(
                "absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent",
                {
                  "via-bgs1/5 to-bgs1": !isApplyCustomColor,
                  "via-ccs5 to-ccs5": isApplyCustomColor
                }
              )}
              style=""
            >
            </span>
          {/if}
        </div>
      {/if}
      {#snippet bottom()}
        <div class="flex flex-col w-full h--5">
          {#key refreshId}
            <NodeThumbnailTitle node={item} {accessPoint} />
          {/key}
          {#if visibleProps.length > 0}
            <div class="py-1">
              <CollectionItemThumbnailProperties
                {item}
                values={item.propertyValues}
                properties={visibleProps}
                collectionId={accessPoint === ResourceAccessPoint.COLLECTION
                  ? accessPointId
                  : undefined}
                {accessPoint}
              />
            </div>
          {/if}
          {@render bottomContent?.()}
        </div>
      {/snippet}
    </ResourceGridThumbnail>
  {:else if arrangement === Arrangement.MASONRY}
    {#if item.cover}
      <CoverRenderer
        cover={item.cover}
        class="absolute inset-0 w-full rounded-t-md object-cover h-full"
      />
    {:else if filePreview}
      <FileView
        file={resolvedFilePreview}
        id={resolvedFilePreviewId}
        isHideControls={true}
        isLazyLoad={true}
        isUseThumbnailIfAvailable={true}
        class={cn("w-full h-auto", {
          "rounded-md": isHideTitle,
          "rounded-t-md": !isHideTitle
        })}
        onLoad={propagateLoad}
      />
    {:else if urlPreview && socialProfileNodeTypeList.has(item.contentType) && !socialProfileWithImageUnavailable.has(item.contentType)}
      <div class="relative h-20">
        <NodeThumbnailTwitterProfilePreview src={urlPreview} />
      </div>
    {:else if urlPreview}
      <ImagePreview
        src={urlPreview}
        {arrangement}
        onLoad={propagateDomLoad}
        class={cn("w-full h-auto", {
          "rounded-md": isHideTitle,
          "rounded-t-md": !isHideTitle
        })}
      />
    {:else if item.contentType === NodeType.AUDIO && _url}
      <div class="overflow-clip text-wrap h-32 w-full flex">
        <NodeThumbnailAudioPreview url={_url} />
      </div>
    {:else if item.contentType === NodeType.PDF && _url}
      <span class="w-full h-80 overflow-clip relative z-0">
        <NodeThumbnailPdfPreview url={_url} />
      </span>
    {:else if contentPreview}
      <div
        class="h-auto p-2 overflow-clip text-wrap max-h-48 text-left text-b3"
      >
        {#if isTextClip}
          <TextClipPreview
            node={item}
            {contentPreview}
            {accessPoint}
            {arrangement}
          />
        {:else if socialPostNodeTypeList.has(item.contentType)}
          <span class="text-fgs3">
            <NodeThumbnailSocialPostPreview
              text={contentPreview}
              {accessPoint}
              contentType={item.contentType}
              isFullExpand={true}
            />
          </span>
        {:else}
          <span class="text-fgs3 userdata">
            {#if item.contentType === NodeType.NODULAR_MARKDOWN}
              {@html renderMdAsHtml(contentPreview)}
            {:else}
              {contentPreview}
            {/if}
          </span>
        {/if}
      </div>
    {/if}
    {#if !isHideTitle || (!filePreview && !urlPreview && !_url && !isValidString(contentPreview))}
      <div class="flex flex-col flex-1 bg-bgs2">
        <div
          class={cn(
            "w-full bg-bgs2 rounded-b-md h-10 p-2 truncate text-b2 flex flex-1 items-center",
            {
              "rounded-md":
                !filePreview && !urlPreview && !_url && !contentPreview
            }
          )}
        >
          {#key refreshId}
            <NodeThumbnailTitle node={item} {accessPoint} />
          {/key}
        </div>
        {#if visibleProps.length > 0}
          <div class="py-1">
            <CollectionItemThumbnailProperties
              {item}
              values={item.propertyValues}
              properties={visibleProps}
              collectionId={accessPoint === ResourceAccessPoint.COLLECTION
                ? accessPointId
                : undefined}
              {accessPoint}
            />
          </div>
        {/if}
      </div>
    {/if}
  {/if}
</ResourceThumbnailBase>
