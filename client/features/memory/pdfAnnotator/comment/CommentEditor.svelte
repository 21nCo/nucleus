<script lang="ts">
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import DatePicker from "@21n/elements/datetime/DatePicker.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonVariant } from "@21n/elements/button/button.type";
  import { Size } from "@21n/elements/size.enum";

  let {
    annotationMode = $bindable(),
    style = "",
    dueDate: initialDueDate = new Date(),
    comment: initialComment = "",
    editingItemType,
    onSave = undefined,
    onUpdate = undefined,
    onCancel = undefined
  }: {
    annotationMode?: AnnotationType;
    style?: string;
    dueDate?: Date;
    comment?: string;
    editingItemType: string;
    onSave?: ((detail: { comment: string; dueDate?: Date }) => void) | undefined;
    onUpdate?: ((comment: string) => void) | undefined;
    onCancel?: (() => void) | undefined;
  } = $props();

  let dueDate = $state(initialDueDate);
  let comment = $state(initialComment);

  $effect(() => {
    comment = initialComment;
    dueDate = initialDueDate;
  });

  function isEditingMode() {
    return comment.length > 0;
  }

  function isTaskMode() {
    return (
      (annotationMode === AnnotationType.TASK &&
        editingItemType != AnnotationType.TASK) ||
      editingItemType === AnnotationType.TASK
    );
  }

  function onSaveClick() {
    if (isTaskMode()) {
      onSave?.({ comment, dueDate });
      return;
    }

    onSave?.({ comment });
  }
</script>

<div
  data-pdf-annotation-overlay
  {style}
  role="presentation"
  tabindex="-1"
  class="border border-brs3 bg-bgs2 rounded-md p-2"
  onclick={(event) => event.stopPropagation()}
  onmousedown={(event) => event.stopPropagation()}
>
  <textarea
    class="min-w-52 h-20 text-b3 bg-bgs1 rounded-md p-2 outline-none"
    bind:value={comment}
    placeholder="Enter your comment"
  ></textarea>
  {#if isTaskMode()}
    <DatePicker bind:date={dueDate} />
  {/if}
  <div class="flex justify-end gap-1 items-center">
    {#if isEditingMode()}
      <Button
        size={Size.xs}
        type={ButtonVariant.PRIMARY}
        label="Update"
        onclick={() => onUpdate?.(comment)}
      />
    {:else}
      <Button
        size={Size.xs}
        type={ButtonVariant.PRIMARY}
        label="Save"
        onclick={onSaveClick}
      />
    {/if}
    <Button
      size={Size.xs}
      parentBgIndex={2}
      label="Cancel"
      onclick={() => onCancel?.()}
    />
  </div>
</div>
