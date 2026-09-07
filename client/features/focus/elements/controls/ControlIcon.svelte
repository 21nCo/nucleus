<script lang="ts">
  import Icon from "@21n/elements/Icon.svelte";
  import view from "@nucleum/stores/view.store";
  import { SessionUIContext } from "@nucleum/features/focus/session.type";
  import { SessionState } from "@nucleum/features/focus/sessionState.enum";
  import { Size } from "@21n/elements/size.enum";
  import { Display } from "@21n/elements/display.enum";
  import { cn } from "@21n/utils/ui.utils";
  import { activeSession } from "@nucleum/features/focus/session.store";
  let {
    icon,
    context = SessionUIContext.DEFAULT
  }: { icon: string; context?: SessionUIContext } = $props();
  let iconSize: Size.md | Size.lg | Size.xl = Size.xl;
  let isBreakReminderMode = $derived(
    $activeSession.timeRemainingToTakeBreak != undefined &&
      $activeSession.timeRemainingToTakeBreak < 0
  );

  let iconSizeDerived = $derived(
    context === SessionUIContext.PIP
      ? Size.md
      : context === SessionUIContext.FOCUS_PLAYER ||
          $view.display === Display.MO
        ? Size.lg
        : Size.xl
  );
</script>

<Icon
  {icon}
  size={iconSizeDerived}
  class={cn(
    {
      "stroke-abg": context !== SessionUIContext.FOCUS_PLAYER
    },
    context === SessionUIContext.FOCUS_PLAYER && {
      "text-cbg":
        $activeSession.state === SessionState.FOCUS_RUNNING &&
        !isBreakReminderMode,
      "text-abg":
        $activeSession.state !== SessionState.FOCUS_RUNNING ||
        isBreakReminderMode
    }
  )}
  isFilled={context === SessionUIContext.FOCUS_PLAYER}
/>
