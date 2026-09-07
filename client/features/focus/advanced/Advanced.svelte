<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import FocusItemList from "@nucleum/features/focus/elements/focusitem/FocusItemList.svelte";
  import IntervalBar from "@nucleum/features/focus/elements/intervalbar/IntervalBar.svelte";
  import view from "@nucleum/stores/view.store";
  import AdvancedPortrait from "@nucleum/features/focus/advanced/AdvancedPortrait.svelte";
  import Divider from "@21n/elements/Divider.svelte";
  import { Orientation } from "@21n/elements/direction.enum";
  import { ColorStrength } from "@21n/theme/appearance.type";
  import TimeComposition from "@nucleum/features/focus/advanced/composition/TimeComposition.svelte";
  import { SessionUIContext } from "@nucleum/features/focus/session.type";
  import FormLabelTooltip from "@21n/elements/text/formLabel/FormLabelTooltip.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { advancedCompositionDraft } from "@nucleum/features/focus/advanced/composition/advancedCompositionDraft.store";

  let isExpandedMode = $derived(
    ($view.landscapiness > 1.4 && $view.scale > 1) || $view.scale > 1.3
  );
</script>

<div class="relative flex flex-col w-full h-full p-4 pb-2 bg--bgs2/40">
  <div class="flex w-full gap-1 items-center">
    <Text style={TextStyle.PANEL_HEADING} content="Advanced focus" />
    <FormLabelTooltip
      icon="ph:info"
      info={{
        body: "Use advanced focus to start a focus session with more granular control. \n 1. Start by adding objectives/tasks that you want to focus. \n 2. Then, set the duration/intervals using presets or custom methods. \n 3. Finally, click on **Start focus** to begin."
      }}
    />
  </div>
  {#if !isExpandedMode}
    <AdvancedPortrait parentBgIndex={1} />
  {:else}
    <div class="flex flex-col w-full flex-grow pb-10">
      <div class="flex pt-4 pb-2">
        <IntervalBar
          context={SessionUIContext.THIN_ON_DESKTOP}
          composition={$advancedCompositionDraft}
        />
      </div>
      <div class="flex gap-4 py-4 flex-grow">
        <div class="flex flex-col gap-8 w-1/2 h-full">
          <TimeComposition parentBgIndex={1} />
        </div>
        <div class="flex flex-col justify-center h-full">
          <div class="h-full pb-4">
            <Divider
              orientation={Orientation.Vertical}
              colorStrength={ColorStrength.Normal}
            />
          </div>
        </div>
        <div class="relative flex flex-col h-full w-1/2">
          <div>
            <Text style={TextStyle.SECTION_HEADING} content="Focus Items" />
          </div>
          <FocusItemList isInEditMode={true} />
        </div>
      </div>
    </div>
  {/if}
</div>
