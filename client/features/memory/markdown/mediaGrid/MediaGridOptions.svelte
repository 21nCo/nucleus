<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import PanelSwitcher from "@21n/elements/switcher/PanelSwitcher.svelte";
  import { Size } from "@21n/types/size.enum";
  import { PanelSwitcherStyle } from "@21n/types/switcher.enum";
  import UploadButton from "@21n/elements/button/UploadButton.svelte";
  import Slider from "@21n/elements/slider/Slider.svelte";
  import { MediaGridType } from "@nucleum/features/memory/node/node.type";
  import { ButtonStyle, ButtonVariant } from "@21n/types/button.type";
  import Button from "@21n/elements/button/Button.svelte";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import { AlertType } from "@21n/types/notification.type";

  let {
    config = $bindable(),
    handleFileUpload,
    sortItems,
    chevUp,
    chevDown,
    handleNewImageLoad,
    columnArray,
    isUploadInProgress = false,
    onDelete = undefined
  }: {
    config?: any;
    handleFileUpload: (event: Event) => void;
    sortItems: (type: MediaGridType.AUTO | MediaGridType.COLUMNS) => void;
    chevUp: () => void;
    chevDown: () => void;
    handleNewImageLoad: () => void;
    columnArray: number[];
    isUploadInProgress?: boolean;
    onDelete?: ((event: CustomEvent<void>) => void) | undefined;
  } = $props();
  const maxLength = 500;

  let isGapSliderEnabled = $state(false);
  let isAltTextEnabled = $state(false);

  function emitDelete() {
    const deleteEvent = new CustomEvent<void>("delete");
    onDelete?.(deleteEvent);
  }

  function checkTextLimit(e: any) {
    if (e.key == "Backspace") {
      return;
    } else if (config.altText.length == maxLength) {
      e.preventDefault();
    }
  }
</script>

<div class="h-10 w-full bg-bgs1 flex items-center gap-4 px-4 py-1">
  <PanelSwitcher
    parentBgIndex={2}
    items={[
      {
        value: MediaGridType.AUTO,
        label: "Auto"
      },
      {
        value: MediaGridType.COLUMNS,
        label: "Columns"
      }
    ]}
    value={config.type}
    style={PanelSwitcherStyle.TRAIN}
    size={Size.sm}
    onSwitch={(e) => {
      sortItems(e.detail);
      config.type = e.detail;
    }}
  />
  <UploadButton
    oninput={handleFileUpload}
    type={ButtonVariant.SECONDARY}
    size={Size.sm}
    accept="image/*,audio/*,video/*,application/pdf"
  />
  <div>
    {#if isUploadInProgress}
      <InlineFeedbackText
        feedback={{
          type: AlertType.PROGRESS,
          message: "Uploading..."
        }}
      />
    {/if}
  </div>
  {#if config.isHovered}
    {#if config.type === MediaGridType.COLUMNS}
      <div
        class="inline-flex gap-1 w-20 h-7 px-2 bg-bgs2 rounded-full text-b3 text-fgs2"
      >
        <div class="flex items-center justify-center px-1">
          {config.noOfColumns}
        </div>
        <div class="inline-flex flex-col">
          <button onclick={chevUp}>
            <Icon icon="chevron-up" size={Size.xs} />
          </button>
          <button onclick={chevDown}>
            <Icon icon="chevron-down" size={Size.xs} />
          </button>
        </div>
        <div class="h-full border border-r-brs3"></div>
        <button
          onclick={() => {
            if (columnArray.length == config.noOfColumns)
              config.noOfColumns += 1;
            else alert("Not more than one empty column can be added");
          }}
        >
          <Icon icon="plus" />
        </button>
      </div>
    {/if}

    <div class="relative ml-auto flex items-center gap-3">
      <button
        class="relative flex items-center"
        onclick={() => (isGapSliderEnabled = !isGapSliderEnabled)}
      >
        {#if isGapSliderEnabled}
          <div
            class="absolute bottom-[150%] -left-[3rem] w-32 h-12 bg-bgs1 rounded-lg border border-bgs4 shadow-lg pt-1"
          >
            <div class="font-sans text-sm w-full">
              <!--The +4px accounts to the invisible border added to draggable elements for feedback animation -->
              {config.gap + 4}px
            </div>
            <Slider
              bind:value={config.gap}
              onInput={() => {
                if (config.type == "AUTO") {
                  handleNewImageLoad();
                }
                //   else ResizeImageForAllColumns();
              }}
            />
          </div>
        {/if}
        <Icon icon="sliders-horizontal" />
      </button>
      <Button
        icon="trash"
        tooltip="Delete"
        type={ButtonVariant.DANGER}
        style={ButtonStyle.OUTLINED}
        size={Size.sm}
        onclick={emitDelete}
      />
    </div>
  {/if}
</div>
