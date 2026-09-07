<script lang="ts">
  import { Arrangement, Orientation } from "@21n/elements/direction.enum";
  import Toggle from "@21n/elements/toggle/Toggle.svelte";
  import { popover } from "@nucleum/actions/popover.action";
  import ArrangementSelectorPopover from "@nucleum/features/collections/arrangementSelector/ArrangementSelectorPopover.svelte";
  import { Resource } from "@nucleum/datafn/resource.enum";
  let {
    arrangement = $bindable(Arrangement.LIST),
    resource = undefined,
    density = $bindable(1),
    isHideThumbnailPreview = $bindable(false),
    isHideThumbnailTitle = $bindable(false),
    isBoardContext = false,
    onArrangementChange = undefined,
    onDensityChange = undefined,
    onPreviewSettingChange = undefined,
    onTitleSettingChange = undefined
  }: {
    arrangement?: Arrangement;
    resource?: Resource | undefined;
    density?: number;
    isHideThumbnailPreview?: boolean;
    isHideThumbnailTitle?: boolean;
    isBoardContext?: boolean;
    onArrangementChange?:
      | ((event: CustomEvent<Arrangement>) => void)
      | undefined;
    onDensityChange?: ((event: CustomEvent<number>) => void) | undefined;
    onPreviewSettingChange?:
      | ((event: CustomEvent<boolean>) => void)
      | undefined;
    onTitleSettingChange?: ((event: CustomEvent<boolean>) => void) | undefined;
  } = $props();

  let isPopoverVisible = false;
  let ref: HTMLElement | null = null;

  const baseArrangements = [
    {
      value: Arrangement.LIST,
      label: "List",
      icon: "list"
    },
    {
      value: Arrangement.GRID,
      label: "Grid",
      icon: "grid"
    }
  ];
  let allArrangements = $derived.by(() => {
    const arrangements = [...baseArrangements];
    if (!isBoardContext && (!resource || resource === Resource.node)) {
      arrangements.push({
        value: Arrangement.MASONRY,
        label: "Masonry",
        icon: "ph:gradient-light"
      });
    }
    return arrangements;
  });

  function resolveIcon(arrangement: Arrangement) {
    return allArrangements.find((a) => a.value === arrangement)?.icon ?? "";
  }
  function emitDensityChange(nextDensity: number) {
    const densityChangeEvent = new CustomEvent<number>("densityChange", {
      detail: nextDensity
    });
    onDensityChange?.(densityChangeEvent);
  }
  function emitArrangementChange(event: CustomEvent) {
    onArrangementChange?.(
      new CustomEvent<Arrangement>("arrangementChange", {
        detail: event.detail
      })
    );
  }

  function emitPreviewSettingChange(e: CustomEvent) {
    onPreviewSettingChange?.(
      new CustomEvent<boolean>("previewSettingChange", {
        detail: e.detail
      })
    );
  }
  function emitTitleSettingChange(e: CustomEvent) {
    onTitleSettingChange?.(
      new CustomEvent<boolean>("titleSettingChange", {
        detail: e.detail
      })
    );
  }

  function onPopoverChange(event: Event) {
    isPopoverVisible =
      (event as CustomEvent<{ open?: boolean }>).detail?.open ?? false;
  }
</script>

<div
  class="flex gap-3"
  bind:this={ref}
  use:popover={{
    content: ArrangementSelectorPopover,
    id: "arrangement-selector-popover",
    componentProps: {
      density,
      arrangement,
      isHideThumbnailPreview,
      isHideThumbnailTitle,
      allArrangements,
      resource,
      onArrangementChange: emitArrangementChange,
      onDensityChange: emitDensityChange,
      onPreviewSettingChange: emitPreviewSettingChange,
      onTitleSettingChange: emitTitleSettingChange
    }
  }}
  onchange={onPopoverChange}
>
  <Toggle icon={resolveIcon(arrangement)} bind:on={isPopoverVisible} />
</div>
