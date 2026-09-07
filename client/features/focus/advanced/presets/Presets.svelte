<script lang="ts">
  import type { SessionComposition } from "@21n/types/pointron/sessionComposition.type";
  import PresetItem from "@nucleum/features/focus/advanced/presets/PresetItem.svelte";
  import { pointronPreferences } from "@nucleum/products/pointron/pointron.store";
  import { onMount } from "svelte";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { compareObjects, deepCopy } from "@21n/shared-utils/obj.utils";
  import { advancedCompositionDraft } from "@nucleum/features/focus/advanced/composition/advancedCompositionDraft.store";
  let {
    parentBackgroundIndex = 1,
    isExpandedVariant = true,
    isInEditMode = false,
    isSettingsContext = false,
    onEdit = undefined,
    onPresetSelect = undefined
  }: {
    parentBackgroundIndex?: number;
    isExpandedVariant?: boolean;
    isInEditMode?: boolean;
    isSettingsContext?: boolean;
    onEdit?: ((event: CustomEvent<SessionComposition>) => void) | undefined;
    onPresetSelect?:
      | ((event: CustomEvent<{ preset: SessionComposition }>) => void)
      | undefined;
  } = $props();
  let selectedPresetIndex = $state(-1);
  async function presetClickHandler(event: any) {
    const preset = event.detail.preset as SessionComposition;
    selectedPresetIndex = resolveSelectedPresetIndex(preset);
    if (!isInEditMode) {
      advancedCompositionDraft.set(deepCopy(preset));
      await activeSession.onPresetSelection(preset);
      const selectEvent = new CustomEvent<{ preset: SessionComposition }>(
        "select",
        {
          detail: { preset }
        }
      );
      onPresetSelect?.(selectEvent);
      return;
    }
    const editEvent = new CustomEvent<SessionComposition>("edit", {
      detail: preset
    });
    onEdit?.(editEvent);
  }

  onMount(() => {
    if (!isInEditMode) {
      const index = resolveSelectedPresetIndex($activeSession.composition);
      if (index !== -1) {
        const isUnaltered = compareObjects(
          $activeSession.composition,
          $pointronPreferences.presets[index]
        );
        if (isUnaltered) {
          selectedPresetIndex = index;
        }
      }
    }
  });

  function resolveSelectedPresetIndex(preset: SessionComposition) {
    return $pointronPreferences.presets.findIndex((x) => x.id === preset.id);
  }
</script>

{#each $pointronPreferences.presets as preset, index (preset.id)}
  <PresetItem
    preset={{ ...preset }}
    {parentBackgroundIndex}
    {isInEditMode}
    {isExpandedVariant}
    {isSettingsContext}
    isActive={selectedPresetIndex === index && !isInEditMode}
    onClick={presetClickHandler}
  />
{/each}
