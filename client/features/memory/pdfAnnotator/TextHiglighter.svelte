<script lang="ts">
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import { highlightStore } from "@nucleum/features/memory/common/highlighters/highlight.store";
  let {
    id = "",
    highlighter = "",
    rects = [],
    annotType = AnnotationType.HIGHLIGHT,
    onClick = undefined
  }: {
    id?: string;
    highlighter?: string;
    rects?: any;
    annotType?: AnnotationType;
    onClick?: ((id: string) => void) | undefined;
  } = $props();

  function resolveColor() {
    return highlightStore.resolveColor(highlighter);
  }

  function resolveUnderlineTop() {
    return annotType === AnnotationType.UNDERLINE ? "100%" : "40%";
  }

  function calculateStyle(rect: any) {
    let bg = "";
    let { x1: left, x2, y1: top, y2 } = rect;
    let width = Math.abs(x2 - left);
    let height = Math.abs(y2 - top);
    let scale = 0.3;
    left -= scale;
    top += scale;
    width += scale * 2;
    height -= scale * 2;
    if (
      annotType === AnnotationType.HIGHLIGHT ||
      annotType === AnnotationType.COMMENT ||
      annotType === AnnotationType.TASK
    )
      bg = `background-color:${resolveColor()};opacity:0.3;`;
    return `position:absolute;left: ${left}px;top: ${top}px;width: ${width}px;height: ${height}px;${bg};-webkit-user-select: none;-moz-user-select: none;-ms-user-select: none;user-select: none;`;
  }

  function handleClick() {
    onClick?.(id);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  }
</script>

{#each rects as rect, index}
  <div
    id={index == 0 ? id : ""}
    class={id}
    role="button"
    tabindex="0"
    data-color={resolveColor()}
    data-highlighter={highlighter}
    data-annotType={annotType}
    style={calculateStyle(rect)}
    onclick={(event) => {
      event.stopPropagation();
      handleClick();
    }}
    onkeydown={handleKeydown}
    onmousedown={(event) => event.stopPropagation()}
  >
    {#if annotType == AnnotationType.UNDERLINE || annotType == AnnotationType.LINETHROUGH}<div
        style="position: absolute;
    top: {resolveUnderlineTop()};
    left: 0;
    border-bottom: 3px solid {resolveColor()};
    width: 100%;"
      ></div>
    {/if}
  </div>
{/each}
