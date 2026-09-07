<script lang="ts">
  import { activeSession } from "@nucleum/features/focus/session.store";
  import {
    SessionCompositionType,
    type SessionComposition
  } from "@21n/types/pointron/sessionComposition.type";
  import { Size } from "@21n/types/size.enum";
  import { SelectionItemActiveStyle } from "@21n/types/switcher.enum";
  import { getTotalsFromComposition } from "@nucleum/features/focus/composition.utils";
  import { formatSeconds } from "@21n/utils/time.utils";
  import Icon from "@21n/elements/Icon.svelte";
  import PresetDurationText from "@nucleum/features/focus/advanced/presets/PresetDurationText.svelte";
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import { abg, cn } from "@21n/utils/ui.utils";
  import Button from "@21n/elements/button/Button.svelte";
  import TextWithHoverTooltip from "@21n/elements/text/TextWithHoverTooltip.svelte";
  let {
    preset,
    isActive = false,
    parentBackgroundIndex = 1,
    isExpandedVariant = false,
    isInEditMode = false,
    isSettingsContext = false,
    onClick = undefined
  }: {
    preset: SessionComposition;
    isActive?: boolean;
    parentBackgroundIndex?: number;
    isExpandedVariant?: boolean;
    isInEditMode?: boolean;
    isSettingsContext?: boolean;
    onClick?:
      | ((event: CustomEvent<{ preset: SessionComposition }>) => void)
      | undefined;
  } = $props();

  // let isHovering: boolean = false;
  let totals = $derived(getTotalsFromComposition({ composition: preset, endTime: $activeSession.end }));
  function handleClick() {
    const clickEvent = new CustomEvent<{ preset: SessionComposition }>("click", {
      detail: { preset }
    });
    onClick?.(clickEvent);
  }
  function deleteHandler(event: any) {
    if (preset && preset.id) pointronPreferences.removePreset(preset.id);
    event.stopPropagation();
  }
</script>

{#if preset.focusDuration || (preset.totalDuration && preset.type === SessionCompositionType.TOTAL_DURATION)}
  <button
    class={cn(
      "relative flex items-center gap-2 px-2 2k:px-3 py-4 rounded-md userdata",
      {
        [abg(isActive, parentBackgroundIndex)]: !isInEditMode,
        "w-full": isExpandedVariant,
        "w-36 min-w-[9rem] h-10": !isExpandedVariant,
        "hover:bg-bgs3": !isActive && !isInEditMode,
        "border border-brs2": !isInEditMode,
        "border border-dashed border-fgs2 hover:bg-bgs2": isInEditMode,
        "max-w-md": isExpandedVariant && !isSettingsContext
      }
    )}
    onclick={handleClick}
  >
    <span class="flex items-center gap-1 h-full min-w-0 flex-1">
      <Icon
        icon={preset.type === SessionCompositionType.POMODORO
          ? "pomodoro"
          : preset.type === SessionCompositionType.TARGET_FOCUS
            ? "bolt"
            : "clock"}
        size={isExpandedVariant ? Size.md : Size.sm}
        isAccentBgContext={isActive}
      />
      <span
        class={cn("text-left truncate", {
          "text-b2": isExpandedVariant,
          "text-b3": !isExpandedVariant
        })}
      >
        {#if preset.name}
          <TextWithHoverTooltip text={preset.name} class="truncate text-left" />
        {:else}
          {formatSeconds(totals.duration)}
        {/if}
      </span>
      {#if preset.objectives && preset.objectives.length > 0}
        <span
          class="text-b3 border border-brs3 rounded-md px-1 ml-1 whitespace-nowrap"
        >
          {preset.objectives.length} objective{preset.objectives.length > 1
            ? "s"
            : ""}
        </span>
      {/if}
    </span>
    <span class="flex justify--end items-center h-full shrink-0">
      <PresetDurationText
        {preset}
        {isExpandedVariant}
        parentBackgroundIndex={parentBackgroundIndex + 1}
        {isActive}
      />
    </span>

    {#if isInEditMode && isExpandedVariant}
      <span
        class={cn("h-full flex items-center rounded-md", {
          "absolute right-0 bg-gradient-to-l from-bgs1 via-bgs1 to-transparent pr-3 pl-10":
            !isSettingsContext
        })}
      >
        <Button
          icon="trash"
          onclick={deleteHandler}
          tooltip="Delete preset"
        />
      </span>
    {/if}
  </button>
{/if}
