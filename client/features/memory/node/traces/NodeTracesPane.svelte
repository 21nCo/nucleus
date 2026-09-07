<script lang="ts">
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import OptionSelector from "@21n/elements/select/OptionSelector.svelte";
  import { hexToRGBA } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.utils";
  import { Size } from "@21n/elements/size.enum";
  import type { IActiveNodeStore } from "@nucleum/features/memory/node/node.store";
  import { getContext } from "svelte";
  import {
    canHaveTraces,
    type IPdfBookmarkBody,
    NodeType,
    socialProfileNodeTypeList
  } from "@nucleum/features/memory/node/node.type";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import Resources from "@nucleum/application/record/Records.svelte";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import { Resource } from "@nucleum/datafn/resource.enum";
  import EmptyStatusView from "@21n/elements/feedback/EmptyStatusView.svelte";
  import { convertDateStringToArray } from "@21n/utils/utils";
  import ScrollViewBottomSpacer from "@21n/layout/scrollView/ScrollViewBottomSpacer.svelte";
  import NodeTasksPane from "@nucleum/features/memory/node/traces/NodeTasksPane.svelte";
  import { resolveNodeIcon } from "@nucleum/features/memory/node/node.utils";
  import { preferences } from "@nucleum/stores/preferences/preferences.store";
  import { Preference } from "@nucleum/stores/preferences/preferences.type";
  import { appStore } from "@nucleum/stores/app.store";
  import { derived } from "svelte/store";
  import Icon from "@21n/elements/Icon.svelte";
  import InlineSearchBar from "@21n/elements/InlineSearchBar.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  const contentContext = getContext<any>("content");

  let {
    node = null
  }: {
    node?: IActiveNodeStore | null;
  } = $props();
  type PdfTrace = IPdfBookmarkBody & {
    id?: string;
    due?: {
      date?: string;
      completed?: boolean;
    };
  };
  let options = $derived(resolveOptions($node?.contentType));
  let selectedType = $state("tasks");
  let searchQuery: string = "";
  const hideHighlightColors = derived(
    [preferences, appStore],
    ([$preferences, $appStore]) => {
      const key = `${$appStore.product}-${Preference.HIDE_HIGHLIGHT_COLORS}`;
      return ($preferences[key] as boolean) ?? false;
    }
  );

  function resolveOptions(contentType: NodeType | undefined) {
    if (!contentType) return [];
    const tasks = {
      value: "tasks",
      label: "Tasks",
      icon: "check-square"
    };
    const comments = {
      value: "comments",
      label: "Comments",
      icon: "chat-two"
    };

    if (
      contentType === NodeType.PDF ||
      contentType === NodeType.WEB_PAGE ||
      contentType === NodeType.KINDLE_BOOK
    ) {
      return [
        {
          value: "clips",
          label: "Bookmarks",
          icon: "bookmark"
        }
        // tasks
      ];
    } else if (socialProfileNodeTypeList.has(contentType)) {
      return [
        {
          value: "clips",
          label: "Posts",
          icon: resolveNodeIcon(contentType)
        }
        // tasks
      ];
    } else if (
      contentType === NodeType.YOUTUBE_VIDEO ||
      contentType === NodeType.YOUTUBE_SHORT
    ) {
      return [
        {
          value: "clips",
          label: "Bookmarks",
          icon: "youtube"
        }
        // tasks
      ];
    } else if (contentType === NodeType.NODULAR_MARKDOWN) {
      return [tasks, comments];
    }
  }

  $effect(() => {
    if (!options?.length) return;
    if (!options.some((option) => option.value === selectedType)) {
      selectedType = options[0]?.value ?? "tasks";
    }
  });

  let pdfAnnotations = $derived.by(() => {
    const baseAnnots = ($node?.pdfAnnotations ?? []) as PdfTrace[];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      return baseAnnots.filter(
        (trace) =>
          trace.selectedText?.toLowerCase().includes(q) ||
          trace.comment?.toLowerCase().includes(q)
      );
    }

    return baseAnnots;
  });

  let clips = $derived.by(() => {
    const baseClips = $node?.clips ?? [];
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      return baseClips.filter((clip) => clip.text?.toLowerCase().includes(q));
    }

    return baseClips;
  });
</script>

{#if options && options.length > 1}
  <OptionSelector {options} size={Size.sm} bind:selected={selectedType} />
{/if}

{#if $node?.contentType === NodeType.PDF || $node?.contentType === NodeType.WEB_PAGE || $node?.contentType === NodeType.KINDLE_BOOK}
  <InlineSearchBar
    bind:query={searchQuery}
    placeholder="Search bookmarks"
    style={InputStyle.FILLED}
  />
{/if}
{#if pdfAnnotations.length > 0}
  {@const hasItems =
    (selectedType === "tasks" &&
      pdfAnnotations.some(
        (trace) => trace.annotType === AnnotationType.TASK
      )) ||
    (selectedType !== "tasks" &&
      pdfAnnotations.some((trace) => trace.annotType !== AnnotationType.TASK))}
  <div class="w-full flex flex-col flex-grow gap-2 overflow-y-scroll">
    {#each pdfAnnotations as trace, index}
      {#if (selectedType == "tasks" && trace.annotType === AnnotationType.TASK) || (selectedType != "tasks" && trace.annotType !== AnnotationType.TASK)}
        {@const color =
          $hideHighlightColors || !trace.color
            ? undefined
            : highlightStore.resolveColor(trace.color)}
        <button
          class="flex flex-col gap-2 w-full cw:p-2 p-3 text-b2 text-left border border-brs3 rounded-md hover:bg-bgs2"
          onclick={() => {
            contentContext.publish("pdf-trace-click", {
              id: trace.id ?? `${trace.pageNumber ?? index}`,
              pageNumber: trace.pageNumber
            });
          }}
        >
          {#if trace.comment}
            <div
              class="flex flex-col gap-2 w-full min-h-fit cw:py-2 py-3 rounded-md"
            >
              {#if trace.selectedText}
                <blockquote
                  class="border-l-2 p-2 opacity-50 text-b3"
                  style={!$hideHighlightColors && color
                    ? `border-color: ${hexToRGBA(color, 0.8)};`
                    : ""}
                >
                  {trace.selectedText?.slice(0, 100) ?? ""}
                </blockquote>
              {/if}
              <div>
                {trace.comment}
              </div>
            </div>
          {:else}
            <div
              class="w-full min-h-fit cw:py-2 py-3 rounded-md"
              style="text-decoration: 2px {trace.annotType?.toLowerCase()} {!$hideHighlightColors &&
              trace.annotType !== AnnotationType.HIGHLIGHT
                ? color
                : ''}; "
            >
              <span
                style={!$hideHighlightColors &&
                trace.annotType === AnnotationType.HIGHLIGHT &&
                color
                  ? `background-color: ${hexToRGBA(color, 0.2)};`
                  : ""}
              >
                {trace.selectedText?.slice(0, 100) ?? ""}</span
              >
            </div>
          {/if}
          {#if trace.due}
            <p class="font-medium trace.due.date">
              <span class="font-normal">Due:</span>
              {trace.due.date}
            </p>
            <!-- <CheckboxInput
              checked={trace.due.completed}
              label={trace.due.date}
              class="font-medium "
            /> -->
          {/if}
          <div
            class="flex gap-2 items-center justify-between text-b3 text-fgs3"
          >
            <div class="flex gap-1 items-center">
              {#if trace.annotType === AnnotationType.COMMENT}
                <Icon icon="chat-three" size={Size.sm} />
              {/if}
              {#if trace.startPageNumber}
                <p>
                  Page {trace.startPageNumber}
                </p>
              {/if}
            </div>
            {#if trace.date}
              {@const [day, month, year] = convertDateStringToArray(trace.date)}
              <p>
                <span>{day}</span>
                <span>{month}</span>
                <span>{year}</span>
              </p>
            {/if}
          </div>
        </button>
      {/if}
    {/each}
    {#if !hasItems}
      <EmptyStatusView
        mainText={selectedType === "tasks"
          ? "No tasks found"
          : "No bookmarks found"}
        subText={selectedType === "tasks"
          ? "This page doesn't have any tasks yet"
          : "This page doesn't have any bookmarks yet"}
      />
    {/if}
  </div>
{:else if canHaveTraces.includes($node?.contentType ?? NodeType.UNKNOWN) && (selectedType === "clips" || !selectedType)}
  {#if clips && clips?.length > 0}
    <div class="h-full w-full overflow-y-auto">
      <Resources
        data={clips}
        accessPoint={ResourceAccessPoint.NODE_TRACES}
        resource={Resource.node}
        size={Size.sm}
        isPreventDefault={$node?.contentType === NodeType.YOUTUBE_VIDEO ||
          $node?.contentType === NodeType.YOUTUBE_SHORT}
        onClick={(event) => {
          if (!event?.detail) return;
          if (!("body" in event.detail)) return;
          if (
            $node?.contentType !== NodeType.YOUTUBE_VIDEO &&
            $node?.contentType !== NodeType.YOUTUBE_SHORT
          )
            return;
          contentContext.publish("yt-trace-click", {
            id: event.detail.id,
            timestamp: event.detail.body.timestamp
          });
        }}
      />
      <ScrollViewBottomSpacer size={Size.lg} />
    </div>
  {:else}
    <EmptyStatusView
      mainText="No bookmarks found"
      subText="This page doesn't have any bookmarks yet"
    />
  {/if}
{:else if selectedType === "tasks"}
  <NodeTasksPane {node} />
{:else if selectedType === "comments"}
  <ComingSoonView
    mainText="Coming soon"
    subText="Commenting will be available soon"
  />
{:else}
  <EmptyStatusView size={Size.sm} mainText="No bookmarks found" />
{/if}
