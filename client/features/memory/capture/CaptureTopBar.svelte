<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import { ButtonStyle, ButtonVariant } from "@21n/elements/button/button.type";
  import LinkboxOnCapture from "@nucleum/features/memory/common/linkbox/LinkboxOnCapture.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { Size } from "@21n/elements/size.enum";
  import { CaptureMethod, type ICaptureLink } from "@nucleum/features/memory/capture/capture.type";
  import view from "@nucleum/stores/view.store";
  import Tag from "@21n/elements/text/Tag.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import Divider from "@21n/elements/Divider.svelte";
  import { ColorStrength } from "@21n/theme/appearance.type";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { KeyboardKey, ModifierKey } from "@21n/elements/keyboard/keyboard.type";
  import CaptureTitle from "@nucleum/features/memory/capture/CaptureTitle.svelte";
  import type { IActiveCaptureStore } from "@nucleum/features/memory/capture/capture.store";
  import { LinkType } from "@nucleum/features/memory/linking/link.type";
  import { CollectionType } from "@nucleum/features/collections/collection.type";
  import { tick } from "svelte";
  import Icon from "@21n/elements/Icon.svelte";
  import { haptic } from "@21n/utils/embed.utils";
  import { MemotronAction } from "@nucleum/features/memory/memory-action.enum";

  let {
    captureStore,
    isHomeContext = $view.isConstrainedWidth,
    onSave = undefined,
    onClear = undefined,
    onFocusBody = undefined
  }: {
    captureStore: IActiveCaptureStore;
    isHomeContext?: boolean;
    onSave?: (() => void | Promise<void>) | undefined;
    onClear?: (() => void) | undefined;
    onFocusBody?: (() => void) | undefined;
  } = $props();
  let linkBoxRef: LinkboxOnCapture;

  async function onLink(e: CustomEvent) {
    if (e.detail.id && e.detail.type === CollectionType.TYPED) {
      $captureStore.expandedType = e.detail.id;
    } else {
      $captureStore.expandedType = null;
    }
  }

  function resolveDirectLinksCount(links: ICaptureLink[] | undefined) {
    const len = links?.filter(
      (x) => x.linkType === LinkType.DIRECT && x.from === "root"
    )?.length;
    if (len && len > 0) return len;
    return undefined;
  }

  async function handleSave() {
    haptic();
    await onSave?.();
  }

  function handleClear() {
    haptic();
    onClear?.();
  }

  export async function toggleLinkBox() {
    toggleLinkExpansion();
    if (!$captureStore.isLinksExpanded) return;
    await tick();
    linkBoxRef?.focus();
  }

  function toggleLinkExpansion() {
    haptic();
    $captureStore.isLinksExpanded = !$captureStore.isLinksExpanded;
  }
</script>

<div class="flex flex-col gap-4 dp:pb-4 items-center w-full">
  <header
    class={cn("flex justify-between gap-4 items-center w-full", {
      "px-12":
        !$view.isConstrainedWidth &&
        $captureStore.method === CaptureMethod.MARKDOWN
    })}
  >
    <div class="flex gap--4 grow">
      <CaptureTitle
        {captureStore}
        {isHomeContext}
        {onFocusBody}
      />
    </div>
    <div class="flex cw:gap-2 gap-3 items-center h-full">
      {#if (!$captureStore.isEmpty && $captureStore.method === CaptureMethod.MARKDOWN) || isHomeContext}
        {#if isHomeContext}
          <Toggle
            icon="link"
            parentBgIndex={2}
            count={resolveDirectLinksCount($captureStore.links)}
            on={$captureStore.isLinksExpanded}
            bgSize={Size.md}
            onChange={toggleLinkExpansion}
            shortcut={MemotronAction.ACTIVATE_LINK_BOX}
          />
        {:else}
          <Tag
            label="Links"
            icon="link"
            isActive={$captureStore.isLinksExpanded}
            count={resolveDirectLinksCount($captureStore.links)}
            isShowExpandFeedbackOnActive={true}
            isRemovable={false}
            onclick={toggleLinkExpansion}
            shortcut={MemotronAction.ACTIVATE_LINK_BOX}
          />
          <div class="h-full py-2">
            <Divider
              orientation={Orientation.Vertical}
              colorStrength={ColorStrength.Strong}
            />
          </div>
        {/if}
        {#if $captureStore.method === CaptureMethod.MARKDOWN}
          <Button
            testId="capture-save-button"
            ariaLabel="Save"
            label={isHomeContext ? undefined : "Save"}
            type={ButtonVariant.PRIMARY}
            size={isHomeContext ? Size.md : Size.sm}
            style={ButtonStyle.OUTLINED}
            isPreventMinWidth={true}
            isLoading={$captureStore.isSaving}
            shortcut={{
              key: KeyboardKey.ENTER,
              modifiers: [ModifierKey.META]
            }}
            icon="save"
            onclick={handleSave}
          />
          <Button
            label={isHomeContext ? undefined : "Clear"}
            style={ButtonStyle.OUTLINED}
            isPreventMinWidth={true}
            size={isHomeContext ? Size.md : Size.sm}
            icon="cross"
            onclick={handleClear}
          />
        {/if}
      {/if}
    </div>
  </header>

  {#if (isHomeContext && $captureStore.isLinksExpanded) || (!isHomeContext && ($captureStore.method !== CaptureMethod.MARKDOWN || ($captureStore.method === CaptureMethod.MARKDOWN && !$captureStore.isEmpty && $captureStore.isLinksExpanded)))}
    <div
      class={cn("w-full h-fit", {
        "dp:px-12": $captureStore.method === CaptureMethod.MARKDOWN
      })}
    >
      <LinkboxOnCapture
        bind:this={linkBoxRef}
        {captureStore}
        onLinked={onLink}
        expand={$captureStore.expandedType}
      />
    </div>
  {/if}
  {#if $captureStore.isProcessingClipboard}
    <div
      class="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-transparent via-bgs2 to-transparent p-2"
    >
      <Icon
        icon="svg-spinners:3-dots-fade"
        size={Size.sm}
        class="stroke-fgs3"
      />
      <span class="text-fgs3"> Processing... </span>
    </div>
  {/if}
</div>
