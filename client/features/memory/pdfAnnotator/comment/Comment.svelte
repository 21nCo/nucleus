<script lang="ts">
  import TextHiglighter from "@nucleum/features/memory/pdfAnnotator/TextHiglighter.svelte";
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";

  let {
    rects,
    rect,
    id,
    highlighter = "",
    annotType = AnnotationType.COMMENT,
    comment = "",
    showIcon = true,
    pageRectTop = 0,
    onClick = undefined
  }: {
    rects?: any;
    rect?: any;
    id: string;
    highlighter?: string;
    annotType?: AnnotationType.TASK | AnnotationType.COMMENT;
    comment?: string;
    showIcon?: boolean;
    pageRectTop?: number;
    onClick?: ((id: string) => void) | undefined;
  } = $props();

  const svgheight = 24;
  const svgwidth = 24;

  function resolveColor() {
    return highlightStore.resolveColor(highlighter);
  }

  function resolvePosition() {
    const x1 = rect?.x1 || (annotType === AnnotationType.COMMENT ? 30 : 20);
    const sourceRect = rects?.[0] ?? {};
    const x2 = rect?.x2 || sourceRect.x2 || x1;
    const y1 = rect?.y1 || sourceRect.y1 || 0;
    const y2 = rect?.y2 || sourceRect.y2 || y1;
    let left = x1;
    let top = y1;
    const scale = 2;
    const tally =
      annotType === AnnotationType.COMMENT ? svgheight : svgheight / 2;

    left -= rects == undefined ? 0 : scale;
    top -= scale;

    return {
      left: left - tally,
      top: top - tally
    };
  }

  function handleClick() {
    onClick?.(id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }
</script>

<div
  class={id}
  role="button"
  tabindex="0"
  data-color={resolveColor()}
  data-highlighter={highlighter}
  data-annotType={annotType}
  data-comment={comment}
  data-pageRectTop={pageRectTop}
  style="position: absolute; left: {resolvePosition().left}px; top: {resolvePosition().top}px; opacity: 0.5;"
  onclick={(event) => {
    event.stopPropagation();
    handleClick();
  }}
  onkeydown={(event) => {
    event.stopPropagation();
    handleKeydown(event);
  }}
  onmousedown={(event) => event.stopPropagation()}
>
  {#if showIcon && annotType === AnnotationType.COMMENT}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={svgheight}
      viewBox="0 -960 960 960"
      width={svgwidth}
      ><path
        d="M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z"
      /></svg
    >
  {:else if annotType === AnnotationType.TASK}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={svgheight}
      viewBox="0 -960 960 960"
      width={svgwidth}
      ><path
        d="m438-240 226-226-58-58-169 169-84-84-57 57 142 142ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"
      /></svg
    >
  {/if}
</div>
{#if rects != undefined}
  <TextHiglighter {highlighter} {annotType} {id} {rects} {onClick} />
{/if}
