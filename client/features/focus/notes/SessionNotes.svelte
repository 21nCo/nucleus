<script lang="ts">
  import Text from "@21n/elements/text/Text.svelte";
  import InlineFeedbackText from "@nucleum/extensions/clipper/InlineFeedbackText.svelte";
  import {
    AlertType,
    type IInlineStatus
  } from "@21n/types/notification.type";
  import { TextStyle } from "@21n/types/text.enum";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import FocusNotes from "@nucleum/features/focus/notes/FocusNotes.svelte";
  import type { IMarkdown } from "@nucleum/features/memory/markdown/md.type";

  let feedback = $state<IInlineStatus | undefined>(undefined);
  const mountTs = new Date().getTime();
  let notes = $state<IMarkdown>({ blocks: [] });

  $effect(() => {
    const sessionNotes = $activeSession.notes;
    if (sessionNotes && sessionNotes !== notes) {
      notes = sessionNotes;
    }
  });

  $effect(() => {
    if ($activeSession.notes !== notes) {
      activeSession.update((session) => ({ ...session, notes }));
    }
  });

  /**
   * Preventing the feedback on mount to avoid flickering
   * @param e
   */
  async function onChange(e: any) {
    const elapsed = new Date().getTime() - mountTs;
    if (elapsed < 2000) return;
    feedback = {
      type: AlertType.PROGRESS,
      message: "Saving..."
    };
    await activeSession.saveNotes();
    setTimeout(() => {
      feedback = {
        type: AlertType.SUCCESS,
        message: "Notes saved"
      };
    }, 1000);
  }
</script>

<FocusNotes
  bind:md={notes}
  parentBgIndex={2}
  onDebouncedChange={onChange}
>
  {#snippet title()}
    <div class="flex gap-2 items-center">
      <Text content="Notes" style={TextStyle.PANEL_HEADING} />
      <InlineFeedbackText {feedback} />
    </div>
  {/snippet}
</FocusNotes>
