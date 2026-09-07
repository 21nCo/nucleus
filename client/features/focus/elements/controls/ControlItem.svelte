<script lang="ts">
  import Extend from "@21n/icons/Extend.svelte";
  import { Control } from "@21n/types/pointron/control.enum";
  import { onMount } from "svelte";
  import { pointronPreferences } from "@nucleum/features/focus/preferences.store";
  import ControlIcon from "@nucleum/features/focus/elements/controls/ControlIcon.svelte";
  import { cn } from "@21n/utils/ui.utils";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  import { SessionUIContext } from "@21n/types/pointron/session.type";
  let {
    control,
    isProminent = false,
    context = SessionUIContext.DEFAULT,
    onClick = undefined
  }: {
    control: Control;
    isProminent?: boolean;
    context?: SessionUIContext;
    onClick?: ((event: CustomEvent<{ control: Control }>) => void) | undefined;
  } = $props();
  let iconProps = $derived({ context });
  let extendDuration = $derived($pointronPreferences.extendDuration);
  let timer: any;
  function clickHandler() {
    const clickEvent = new CustomEvent<{ control: Control }>("click", {
      detail: { control }
    });
    onClick?.(clickEvent);
  }
  let isBreakReminderMode = $derived(
    $activeSession.timeRemainingToTakeBreak != undefined &&
      $activeSession.timeRemainingToTakeBreak < 0
  );
  onMount(() => {
    //todo - later - causing flickering of the screen
    // if (isProminent) {
    //   ringStyles = "w-14 h-14 opacity-80";
    //   timer = setInterval(() => {
    //     zoomed = !zoomed;
    //     ringStyles = zoomed
    //       ? "w-24 h-24 opacity-0 transition-all duration-500"
    //       : "w-14 h-14 opacity-80";
    //   }, 600);
    // } else {
    //   clearInterval(timer);
    // }
    return () => {
      clearInterval(timer);
    };
  });
</script>

<button
  onclick={(event) => {
    clickHandler();
    event.stopPropagation();
  }}
  class="relative"
>
  <div
    class={cn(
      "relative rounded-full flex items-center justify-center",
      {
        "dp:w-20 dp:h-20 w-16 h-16 hover:bg-opacity-80":
          context === SessionUIContext.DEFAULT,
        "w-12 h-12 hover:bg-opacity-80": context === SessionUIContext.PIP
      },
      context === SessionUIContext.FOCUS_PLAYER && {
        "w-10 h-10 dp:w-12 dp:h-12 border hover:border-2": true,
        "border-cbg":
          $activeSession.state == SessionState.FOCUS_RUNNING &&
          !isBreakReminderMode,
        "border-abg":
          $activeSession.state != SessionState.FOCUS_RUNNING ||
          isBreakReminderMode
      },
      context !== SessionUIContext.FOCUS_PLAYER && {
        "bg-ass1": control === Control.BREAK || control === Control.ABANDON,
        "bg-ags1": control === Control.RESUME,
        "bg-aps1":
          control === Control.START ||
          control === Control.SKIPBREAK ||
          control === Control.FINISH
      }
    )}
  >
    {#if control === Control.START || control === Control.RESUME || control === Control.SKIPBREAK}
      <!-- <Start {width} /> -->
      <ControlIcon icon="play-circle" {...iconProps} />
    {:else if control === Control.BREAK}
      <ControlIcon icon="clock" {...iconProps} />
      <!-- <Break {width} /> -->
    {:else if control === Control.EXTEND}
      <Extend minutes={extendDuration} />
    {:else if control === Control.FINISH}
      <!-- <Finish {width} /> -->
      <ControlIcon icon="arrow-circle-right" {...iconProps} />
    {:else if control === Control.ABANDON}
      <ControlIcon icon="cross" {...iconProps} />
    {/if}
    {#if isProminent}
      <!-- <div
        class={`absolute rounded-full border-2  ${ringStyles}`}
        style="border-color: rgba(var(--colors-{color}))"
      /> -->
    {/if}
  </div>
  {#if context === SessionUIContext.DEFAULT}
    <div
      class="absolute top-full left-0 text-fgs2 self-center flex w-full justify-center mo:text-b3 mt-1"
    >
      {#if control === Control.START}
        Start
      {:else if control === Control.RESUME}
        Resume
      {:else if control === Control.SKIPBREAK}
        Skip break
      {:else if control === Control.BREAK}
        Break
      {:else if control === Control.EXTEND}
        Extend
      {:else if control === Control.FINISH}
        Finish
      {:else if control === Control.ABANDON}
        Abandon
      {/if}
    </div>
  {/if}
</button>
