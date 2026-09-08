<script lang="ts">
  import TextSearchInput from "@21n/elements/input/TextSearchInput.svelte";
  import LinkSearchResultItem from "@nucleum/features/memory/common/linkbox/LinkSearchResultItem.svelte";
  import type { IPopoverOptions } from "@nucleum/actions/popover.type";
  import { Placement } from "@21n/elements/direction.enum";
  import { type InputLabel, InputStyle } from "@21n/elements/input/input.type";
  import {
    queryLinkingSearchResults,
    queryLinkingSearchResultsOnExtension
  } from "@nucleum/features/memory/linking/link-search";
  import { onMount } from "svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import { isExtensionEnvironment } from "@21n/utils/browser.utils";
  import view from "@nucleum/stores/view.store";
  import { NodeType } from "@nucleum/schema/legacy/node-type.enum";
  import {
    CollectionLayout,
    CollectionType
  } from "@nucleum/features/collections/collection.type";
  import { isValidArrayWithData } from "@21n/shared-utils/obj.utils";
  import { toasts } from "@nucleum/stores/notification.store";
  import type { IRecordId } from "@nucleum/schema/legacy/data.type";
  import context from "@nucleum/stores/context.store";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { generateResourceId } from "@nucleum/datafn/id.utils";
  import { datafn } from "@nucleum/datafn/datafn.store";
  let {
    accessPoint = ResourceAccessPoint.CAPTURE,
    isCollectionsLane = false,
    resultsPlacement = Placement.BottomCenter,
    searchQuery = $bindable(""),
    onSelectCallback = undefined,
    onHideCallback = undefined,
    excludeFromSearch = [],
    onFocus = undefined,
    onHide = undefined,
    onSelect = undefined
  }: {
    accessPoint?: ResourceAccessPoint;
    isCollectionsLane?: boolean;
    resultsPlacement?: Placement;
    searchQuery?: string;
    onSelectCallback?: ((item: any) => void) | undefined;
    onHideCallback?: (() => void) | undefined;
    excludeFromSearch?: IRecordId[];
    onFocus?: ((event: CustomEvent<void>) => void) | undefined;
    onHide?: ((event: CustomEvent<void>) => void) | undefined;
    onSelect?: ((event: CustomEvent<any>) => void) | undefined;
  } = $props();
  let popoverOptions = $state<IPopoverOptions | undefined>(undefined);
  let inputStyle = $state<InputStyle>(InputStyle.PLAIN);
  let placeholder = $state(
    "Start typing to link to a node or add to a curation"
  );
  let icon = $state("");
  let label = $state<InputLabel | undefined>(undefined);
  let searchInputRef = $state<TextSearchInput | undefined>(undefined);
  let isCreationInProgress = $state(false);

  $effect(() => {
    accessPoint;
    isCollectionsLane;
    resultsPlacement;
    resolveOptions();
  });

  export function focus() {
    searchInputRef?.focus();
    searchInputRef?.showDefaultResults();
  }

  onMount(() => {
    if (isCollectionsLane) {
      focus();
    }
  });

  function resolveOptions() {
    switch (accessPoint) {
      case ResourceAccessPoint.CAPTURE:
        popoverOptions = {
          offsetInPx: 12,
          placement: Placement.TopCenter
        };
        placeholder = "Link to a node or add to a collection";
        inputStyle = InputStyle.PLAIN;
        break;
      case ResourceAccessPoint.NODE_LINKS:
        popoverOptions = {
          placement: Placement.BottomCenter
        };
        placeholder = "Start searching to add a direct link";
        icon = "link";
        inputStyle = InputStyle.BORDERED;
        break;
      case ResourceAccessPoint.CLIPPER:
        popoverOptions = {
          offsetInPx: 6,
          isUseAbsolutePositioning: true,
          placement: resultsPlacement
        };
        placeholder = "Link to a node or add to a collection";
        icon = "link";
        inputStyle = InputStyle.BORDERED;
        break;
    }
    if (isCollectionsLane) {
      popoverOptions = {
        offsetInPx: 4,
        placement: Placement.TopCenter
      };
      placeholder = "Start searching to add to a collection";
      inputStyle = InputStyle.BORDERED;
    }
  }

  function onsearch(searchQuery: string) {
    let query = searchQuery;
    let resource = isCollectionsLane
      ? Resource.collection
      : accessPoint === ResourceAccessPoint.NODE_LINKS
        ? Resource.node
        : undefined;
    if (
      searchQuery?.startsWith("@") &&
      accessPoint !== ResourceAccessPoint.NODE_LINKS
    ) {
      resource = Resource.collection;
      query = searchQuery.slice(1);
    }
    if (isExtensionEnvironment()) {
      return queryLinkingSearchResultsOnExtension(query, resource);
    }
    return queryLinkingSearchResults(query, {
      resource,
      exclude: excludeFromSearch,
      collectionResource:
        accessPoint === ResourceAccessPoint.OBJECTIVE
          ? [Resource.objective]
          : accessPoint === ResourceAccessPoint.NODE
            ? [Resource.node]
            : undefined
    });
  }

  function handleSelect(e: CustomEvent) {
    onSelect?.(e);
    onSelectCallback?.(e.detail.item);
    if (searchInputRef && typeof searchInputRef.reset === "function")
      searchInputRef.reset();
  }

  function handleHide() {
    const hideEvent = new CustomEvent<void>("hide");
    onHide?.(hideEvent);
    onHideCallback?.();
  }

  function handleFocus() {
    const focusEvent = new CustomEvent<void>("focus");
    onFocus?.(focusEvent);
  }

  function resolveResourceForCreation(
    accessPoint: ResourceAccessPoint
  ): Resource | undefined {
    switch (accessPoint) {
      case ResourceAccessPoint.CAPTURE:
      case ResourceAccessPoint.CLIPPER:
      case ResourceAccessPoint.NODE:
        return Resource.node;
      case ResourceAccessPoint.OBJECTIVE:
        return Resource.objective;
      default:
        return undefined;
    }
  }

  async function createCollection(label: string, resource: Resource | undefined) {
    const collectionId = generateResourceId(Resource.collection);
    const viewId = generateResourceId(Resource.view);
    const collection = {
      id: collectionId,
      label,
      type: CollectionType.TYPED,
      typeToExtend: "",
      resource: resource ?? Resource.node
    };
    await datafn.view.mutate({
      operation: "insert",
      id: viewId,
      record: {
        id: viewId,
        layout: CollectionLayout.BOARD,
        label: "Default",
        tabBy: "none",
        groupBy: "none",
        subGroupBy: "none"
      }
    });
    await datafn.collection.mutate([
      {
        operation: "insert",
        id: collectionId,
        record: collection
      },
      {
        operation: "relate",
        id: collectionId,
        relations: {
          views: [{ $ref: viewId, sortOrder: 0 }]
        }
      }
    ]);
    return [collection];
  }

  async function onEmptyEnter(
    e: CustomEvent<{ event: KeyboardEvent; value: string }>
  ) {
    if (!e.detail.event || !e.detail.value) return;
    isCreationInProgress = true;
    let result: any;
    if (
      isCollectionsLane ||
      ((accessPoint === ResourceAccessPoint.CAPTURE ||
        accessPoint === ResourceAccessPoint.CLIPPER) &&
        (e.detail.event.shiftKey || e.detail.value.startsWith("@")))
    ) {
      let val = e.detail.value;
      if (val.startsWith("@")) {
        val = val.slice(1);
      }
      result = await createCollection(
        val,
        resolveResourceForCreation(accessPoint)
      );
    } else {
      const node = {
        id: generateResourceId(Resource.node),
        label: e.detail.value,
        contentType: NodeType.NODULAR_MARKDOWN,
        body: ""
      };
      await datafn.node.mutate({
        operation: "insert",
        id: node.id,
        record: node
      });
      result = [node];
    }
    if (result && isValidArrayWithData(result)) {
      handleSelect({ detail: { item: result[0] } } as CustomEvent);
      if (searchInputRef && typeof searchInputRef.reset === "function")
        searchInputRef.reset();
    } else {
      toasts.error("Something went wrong. Please try again later.");
    }
    isCreationInProgress = false;
  }

  function resolveEmptyStateLabel(searchQuery: string, isSaving: boolean) {
    if (isSaving) {
      return `Creating...`;
    }
    if (isCollectionsLane || searchQuery?.startsWith("@")) {
      return `No collections found. Press **Enter** to create a new collection`;
    } else if (accessPoint === ResourceAccessPoint.NODE_LINKS) {
      return `No nodes found. Press **Enter** to create a new node`;
    } else {
      return $context.isTouchDevice
        ? `No results found. Press **Enter** to create a new node`
        : `No results found. Press **Enter** to create a new node or **Shift + Enter** to create a new collection`;
    }
  }

  function resolveBottomMessage(accessPoint: ResourceAccessPoint) {
    switch (accessPoint) {
      case ResourceAccessPoint.CAPTURE:
      case ResourceAccessPoint.CLIPPER:
        return "Use **@** prefix to search for collections";
      default:
        return undefined;
    }
  }
</script>

<TextSearchInput
  bind:this={searchInputRef}
  bind:value={searchQuery}
  isInline={isCollectionsLane}
  width={$view.isConstrainedWidth
    ? "w-full"
    : isCollectionsLane && $view.isPortrait
      ? "w-80"
      : undefined}
  style={inputStyle}
  {icon}
  {label}
  searchResultComponent={LinkSearchResultItem}
  searchResultComponentProps={{
    isHideResourceType:
      isCollectionsLane || accessPoint === ResourceAccessPoint.NODE_LINKS
  }}
  {popoverOptions}
  emptyStateLabel={resolveEmptyStateLabel(searchQuery, isCreationInProgress)}
  onSelect={handleSelect}
  onHide={handleHide}
  {onEmptyEnter}
  onFocus={handleFocus}
  searchCallback={onsearch}
  {placeholder}
  isShowPopoverOnFocus={true}
  bottomMessage={resolveBottomMessage(accessPoint)}
/>
