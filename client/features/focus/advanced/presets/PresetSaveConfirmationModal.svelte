<script lang="ts">
  import {
    activeSession,
    focusItemsStore
  } from "@nucleum/features/focus/session.store";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import { Orientation } from "@21n/types/direction.enum";
  import PresetItem from "@nucleum/features/focus/advanced/presets/PresetItem.svelte";
  import PresetObjectivesSelector from "@nucleum/features/focus/advanced/presets/PresetGoalsSelector.svelte";
  import type { IObjectiveThumb } from "@nucleum/features/focus/goals/goal.type";
  import { onMount } from "svelte";
  import type { IFocusItem } from "@21n/types/pointron/session.type";
  import ModalFooter from "@nucleum/application/modal/ModalFooter.svelte";
  import { PointronAction } from "@21n/types/pointron/pointronAction.enum";
  import { Size } from "@21n/types/size.enum";
  import ModalContentPadded from "@nucleum/application/modal/ModalContentPadded.svelte";
  import { datafn } from "@nucleum/datafn/datafn.store";
  import { advancedCompositionDraft } from "@nucleum/features/focus/advanced/composition/advancedCompositionDraft.store";
  let selectedObjectives = $state<IObjectiveThumb[]>([]);
  let newPresetLabel = $state("");
  const currentComposition = $derived(
    $advancedCompositionDraft ?? $activeSession.composition
  );

  onMount(async () => {
    const currentFocusItems = $focusItemsStore.items;
    if (currentFocusItems?.length) {
      const focusItemIds = currentFocusItems.map((item) => item.id);
      const objectives = await datafn.objective.query({
        select: ["*", "children.*", "tasks.*"],
        filters: {
          id: { $in: focusItemIds }
        }
      });
      if (objectives.data) {
        selectedObjectives = objectives.data as IObjectiveThumb[];
      }
    }
  });

  async function savePreset() {
    return activeSession.saveCurrentCompositionAsPreset({
      objectives: selectedObjectives.map((g) => g.id),
      name: newPresetLabel,
      composition: currentComposition
    });
  }
</script>

<div class="flex flex-col gap-6 justify-between w-full h-full">
  <ModalContentPadded class="flex flex-col gap-6 flex-grow">
    <div class="flex justify-center">
      <PresetItem
        preset={{
          ...currentComposition,
          name: newPresetLabel,
          objectives: selectedObjectives.map((g) => g.id)
        }}
        isExpandedVariant={true}
      />
    </div>
    <TextInput
      bind:value={newPresetLabel}
      placeholder="Preset name or leave empty"
      label={{ label: "Preset name", orientation: Orientation.Vertical }}
    />
    <PresetObjectivesSelector bind:selectedObjectives />
  </ModalContentPadded>
  <ModalFooter
    action={PointronAction.SAVE_PRESET_MODAL}
    size={Size.sm}
    primaryAction={{
      label: "Save",
      callback: savePreset
    }}
    secondaryAction={{
      label: "Cancel"
    }}
  />
</div>
