<script lang="ts">
  import EditToggleButton from "@21n/elements/toggle/EditModeToggle.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import { isInEditMode } from "@nucleum/stores/app.store";
  import { focusItemsStore } from "@nucleum/features/focus/session.store";
  import { Action } from "@nucleum/application/commandBar/action.enum";
  import ShortcutText from "@21n/elements/text/ShortcutText.svelte";
</script>

<div class="flex flex-col w-full items-center gap-2">
  <div class="flex w-full justify-between">
    <Text style={TextStyle.PANEL_HEADING_SMALL} content="Focus Items" />
    <span class="flex items-center gap-1">
      <EditToggleButton />
      <ShortcutText shortcut={Action.EDIT_MODE} parentBgIndex={1} />
    </span>
  </div>
  <div class="flex flex-col items-center gap-1 text-fgs3">
    {#if $isInEditMode}
      <span class="text-b3">Edit mode is on.</span>
      <span class="text-b4"
        >Turn off edit mode to start tasks or switch between them.</span
      >
    {:else if $focusItemsStore.items.length > 0}
      <span class="text-b3">
        Tap on a objective/task to start or stop focusing it.
      </span>
    {/if}
  </div>
</div>
