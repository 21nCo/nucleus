<script lang="ts">
  import Presets from "@nucleum/features/focus/advanced/presets/Presets.svelte";
  import { appStore } from "@nucleum/stores/app.store";
  import { PointronAction } from "@nucleum/features/focus/pointronAction.enum";
  function handleEdit(event: any) {
    if (!event.detail?.id) return;
    appStore.runAction(PointronAction.EDIT_PRESET, {
      componentParams: { id: event.detail.id }
    });
  }
</script>

<div class="w-full h-full overflow-y-auto flex flex-col gap-2 dp:gap-3">
  <Presets isInEditMode={true} onEdit={handleEdit} isSettingsContext={true} />
</div>
