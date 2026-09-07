<script lang="ts">
  import Button from "@21n/elements/button/Button.svelte";
  import TypewritingText from "@21n/elements/text/animatingText/TypewritingText.svelte";
  import modalEvent from "@nucleum/stores/overlays/modal.store";
  import { Size } from "@21n/elements/size.enum";
  import FocusPlayerTimeText from "@nucleum/features/focus/player/FocusPlayerTimeText.svelte";
  import SessionNotes from "@nucleum/features/focus/notes/SessionNotes.svelte";
  import { PointronAction } from "@nucleum/features/focus/pointronAction.enum";
  import { ButtonStyle } from "@21n/elements/button/button.type";
  import view from "@nucleum/stores/view.store";
</script>

<div
  class="w-full h-full bg-bgs1 flex flex-col justify-between items-center mo:p-4 p-8 otop:pt-12"
>
  <div
    class="w-full text-h5 flex-grow flex justify-center portrait:flex-col-reverse"
  >
    <div class="portrait:h-2/5 w-full landscape:w-1/3 flex flex-col">
      {#if !$view.isConstrainedWidth}
        <div>
          <Button
            label="Go back"
            icon="undo"
            style={ButtonStyle.PLAIN}
            size={Size.sm}
            onclick={() => {
              modalEvent.hide(PointronAction.THINK_MODE);
            }}
          />
        </div>
      {/if}
      <div class="w-full grow flex justify-center items-center">
        <TypewritingText text="Thinking..." />
      </div>
      <div class="flex gap-3 text-b2 text-fgs3 justify-between items-center">
        {#if $view.isConstrainedWidth}
          <Button
            label="Go back"
            icon="undo"
            style={ButtonStyle.PLAIN}
            size={Size.sm}
            onclick={() => {
              modalEvent.hide(PointronAction.THINK_MODE);
            }}
          />
        {/if}
        <div>
          <FocusPlayerTimeText />
        </div>
      </div>
    </div>
    <div
      class="bg-bgs2 mo:p-4 p-6 2k:p-10 rounded-md flex flex-col items-start overflow-y-auto portrait:h-3/5 landscape:w-2/3"
    >
      <SessionNotes />
    </div>
  </div>
</div>
