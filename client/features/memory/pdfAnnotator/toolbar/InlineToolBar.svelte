<script lang="ts">
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import Button from "@21n/elements/button/Button.svelte";
  import { resolveAnnotationModes } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.utils";
  import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
  let {
    selectedColor = $bindable(""),
    style = "",
    onAnnotate = undefined
  }: {
    selectedColor?: string;
    style?: string;
    onAnnotate?: ((annotation: AnnotationType) => void) | undefined;
  } = $props();

  function propagate(annotation: AnnotationType) {
    onAnnotate?.(annotation);
  }
  function onAnnotateClick(value: IToggleItem["value"]) {
    propagate(value as AnnotationType);
  }
  const annotationModes: IToggleItem[] = resolveAnnotationModes();
</script>

<div
  data-pdf-annotation-overlay
  class="flex gap-2 text-lg min-h-fit px-3 py-1 material-symbols-rounded bg-bgs2 rounded-md border border-brs3"
  {style}
  role="toolbar"
  tabindex="0"
  onmousedown={(event) => event.stopPropagation()}
>
  <div class="flex gap-1">
    {#each annotationModes as mode}
      <Button
        icon={mode.icon}
        parentBgIndex={2}
        onclick={() => onAnnotateClick(mode.value)}
      />
    {/each}
  </div>
</div>
