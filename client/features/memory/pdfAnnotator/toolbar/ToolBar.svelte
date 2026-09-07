<script lang="ts">
  import { AnnotationType } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.type";
  import ToggleGroup from "@21n/elements/toggle/ToggleGroup.svelte";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { ColorStrength } from "@21n/theme/appearance.type";
  import { Size } from "@21n/elements/size.enum";
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { InputStyle } from "@21n/elements/input/input.type";
  import { resolveAnnotationModes } from "@nucleum/features/memory/pdfAnnotator/pdfAnnotator.utils";
  import HighlightColors from "@nucleum/features/memory/common/highlighters/HighlightColors.svelte";
  import type { IToggleItem } from "@21n/elements/toggle/toggle.type";
  import { ResourceAccessPoint } from "@nucleum/datafn/resource.type";
  import context from "@nucleum/stores/context.store";
  import { Embed, OperatingSystem } from "@nucleum/client/runtime/context.type";
  import view from "@nucleum/stores/view.store";

  let {
    selectedColor = $bindable(""),
    style = "",
    pageNumber = 1,
    totalPages = 1,
    selectedAnnotationMode = $bindable(),
    accessPoint = ResourceAccessPoint.SELF,
    isSearchActive = false,
    onGoToPage = undefined,
    onSearchToggle = undefined,
    onPageRerender = undefined
  }: {
    selectedColor?: string;
    style?: string;
    pageNumber?: number;
    totalPages?: number;
    selectedAnnotationMode?: AnnotationType;
    accessPoint?: ResourceAccessPoint;
    isSearchActive?: boolean;
    onGoToPage?: ((detail: { page: number }) => void) | undefined;
    onSearchToggle?: ((isActive: boolean) => void) | undefined;
    onPageRerender?: ((mode: string) => void) | undefined;
  } = $props();

  const annotationModes: IToggleItem[] = resolveAnnotationModes();
  const dev_isEnableJumpToPage = false;

  let pageInput = $state("");
  let isEditingPage = $state(false);

  $effect(() => {
    if (!isEditingPage) {
      pageInput = `${pageNumber}`;
    }
  });

  function isExpanded() {
    return (
      accessPoint === ResourceAccessPoint.SELF &&
      $context.embed !== Embed.HANDSET &&
      $context.os !== OperatingSystem.IOS
    );
  }

  function commitPageInput() {
    const parsed = Number.parseInt(pageInput, 10);
    if (Number.isNaN(parsed)) {
      pageInput = `${pageNumber}`;
      return;
    }

    const limited = Math.min(Math.max(parsed, 1), totalPages || 1);
    onGoToPage?.({ page: limited });
  }

  function handleAnnotationModeChange(value: string) {
    selectedAnnotationMode = value as AnnotationType;
  }
</script>

<div
  class="flex portrait:flex-row flex-col portrait:h-12 min-w-fit min-h-fit py-2 px-1 justify-between items-center bg-bgs2 rounded-md border border-brs3 shadow-sm"
  {style}
>
  {#if isExpanded()}
    <ToggleGroup
      class="portrait:flex-row flex-col"
      items={annotationModes}
      size={Size.lg}
      parentBgIndex={2}
      onChange={(event) => handleAnnotationModeChange(event.detail)}
      onNone={() => {
        selectedAnnotationMode = AnnotationType.NONE;
      }}
    />
    <Toggle
      icon="search"
      tooltip="Search"
      parentBgIndex={2}
      on={isSearchActive}
      onChange={() => {
        onSearchToggle?.(!isSearchActive);
      }}
    />
    <span class="portrait:px-1 py-1"></span>
    <Divider
      orientation={$view.isPortrait
        ? Orientation.Vertical
        : Orientation.Horizontal}
      colorStrength={ColorStrength.Strong}
    />
  {/if}
  <div
    class="flex portrait:flex-row flex-col justify-center items-center gap-2 py-1"
  >
    <Button
      icon="magnifying-glass-plus"
      parentBgIndex={2}
      onclick={() => {
        onPageRerender?.("ZOOMIN");
      }}
    />
    {#if dev_isEnableJumpToPage}
      <div
        class="flex flex-col items-center gap-2 min-w-fit text-fgs1 text-b2 pt-1 font-sans"
      >
        <div class="portrait:w-12">
          <TextInput
            bind:value={pageInput}
            type="number"
            style={InputStyle.PLAIN}
            size={Size.sm}
            parentBackgroundIndex={2}
            numberInputParams={{ min: 1, max: totalPages, step: 1 }}
            onFocus={() => {
              isEditingPage = true;
            }}
            onBlur={() => {
              commitPageInput();
              isEditingPage = false;
            }}
            onEnter={() => {
              commitPageInput();
              isEditingPage = false;
            }}
          />
        </div>
        <span>/ {totalPages}</span>
      </div>
    {/if}

    <Button
      icon="magnifying-glass-minus"
      parentBgIndex={2}
      onclick={() => {
        onPageRerender?.("ZOOMOUT");
      }}
    />
  </div>
  {#if isExpanded()}
    <Divider
      orientation={$view.isPortrait
        ? Orientation.Vertical
        : Orientation.Horizontal}
      colorStrength={ColorStrength.Strong}
    />
    <span class="flex portrait:flex-row flex-col items-center py-2">
      <HighlightColors
        bind:selected={selectedColor}
        orientation={$view.isPortrait
          ? Orientation.Horizontal
          : Orientation.Vertical}
      />
    </span>
  {/if}
</div>
