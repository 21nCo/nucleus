<script lang="ts">
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { Size } from "@21n/types/size.enum";
  import { cn } from "@21n/utils/ui.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import NodeTitleLabelPart from "@nucleum/features/memory/node/title/NodeTitleLabelPart.svelte";
  import type { IActiveNode } from "@nucleum/features/memory/node/node.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import context from "@nucleum/stores/context.store";
  import TextInputOnKeyboardToolbar from "@21n/elements/input/TextInputOnKeyboardToolbar.svelte";
  import RecordStarStatusFeedback from "@nucleum/application/record/RecordStarStatusFeedback.svelte";
  let {
    node,
    accessPoint = ResourceAccessPoint.SELF,
    onLabelChange = undefined,
    onEditModeChange = undefined
  }: {
    node: IActiveNode;
    accessPoint?: ResourceAccessPoint;
    onLabelChange?: ((label: string) => void) | undefined;
    onEditModeChange?: ((value: boolean) => void) | undefined;
  } = $props();
  let previousLabel = node.label;
  let isKeyboardEditorMounted = false;
  let keyboardEditorRef: TextInputOnKeyboardToolbar;
  let textInputRef: TextInput;

  function propagateLabelChange(label: string) {
    onLabelChange?.(label);
  }

  function propagateEditModeChange(value: boolean) {
    onEditModeChange?.(value);
  }
</script>

<div
  class={cn("flex items-center flex-1 min-w-0 gap-2", {
    "max-w-fit": !node.isInEditMode,
    "h-12": accessPoint !== ResourceAccessPoint.CLIPPER
  })}
>
  {#if !node.focusedBlock}
    {#if node.isInEditMode}
      {#if $context.isTouchDevice}
        <TextInputOnKeyboardToolbar
          bind:value={node.label}
          bind:this={keyboardEditorRef}
          onDebouncedChange={(event) => {
            propagateLabelChange(event.detail);
          }}
          onMount={() => {
            isKeyboardEditorMounted = true;
            keyboardEditorRef?.focus();
          }}
          onSave={() => {
            propagateEditModeChange(false);
          }}
          onCancel={() => {
            node.label = previousLabel;
            isKeyboardEditorMounted = false;
            propagateLabelChange(node.label ?? "");
            propagateEditModeChange(false);
          }}
        />
      {/if}
      <TextInput
        size={Size.xl}
        bind:value={node.label}
        bind:this={textInputRef}
        placeholder="Enter title"
        width="w-full"
        onMount={() => {
          textInputRef?.focus();
          keyboardEditorRef?.focus();
        }}
        isPreserveKeyboardToolbar={isKeyboardEditorMounted}
        isShowSaveControl={true}
        onEnter={() => {
          propagateLabelChange(node.label ?? "");
          propagateEditModeChange(false);
        }}
        onSave={() => {
          propagateLabelChange(node.label ?? "");
          propagateEditModeChange(false);
        }}
        onCancel={() => {
          node.label = previousLabel;
          propagateLabelChange(node.label ?? "");
          propagateEditModeChange(false);
        }}
      />
    {:else}
      <span class="text-start truncate">
        <NodeTitleLabelPart
          item={node}
          isNodePageContext={true}
          {accessPoint}
          onClick={() => {
            previousLabel = node.label;
            propagateEditModeChange(true);
          }}
        />
      </span>
    {/if}
    <RecordStarStatusFeedback isStarred={node.isStarred} />
  {/if}
</div>
