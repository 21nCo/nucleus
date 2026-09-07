<svelte:options runes={true} />

<script lang="ts">
  import { backgroundSoundStore } from "@nucleum/features/focus/backgroundMusic/background-sound.store";
  import { activeSession } from "@nucleum/features/focus/session.store";
  import { isValidString } from "@21n/shared-utils/text.utils";
  import { onMount } from "svelte";
  import { SessionState } from "@21n/types/pointron/sessionState.enum";
  let audioRef: HTMLAudioElement;
  let src = $state<string | undefined>(undefined);
  onMount(() => {
    // audioRef.volume = 0.1;
    //if ($backgroundSoundStore) audioRef.play();
    const bgSoundSub = backgroundSoundStore.subscribe((sound) => {
      if (
        sound.systemSound?.toLowerCase() === "none" ||
        !isValidString(sound.systemSound)
      ) {
        stopAudio();
        return;
      } else {
        src = `/sounds/${sound.systemSound?.toLowerCase()}.mp3`;
        playIfSoundFileExists();
      }
    });
    const sessionStoreSub = activeSession.subscribe((x) => {
      if (
        !x?.isSessionRunning ||
        (x?.isSessionRunning && x?.state != SessionState.FOCUS_RUNNING)
      ) {
        stopAudio();
      } else if ($backgroundSoundStore?.systemSound != "none" && src) {
        playIfSoundFileExists();
      }
    });
    return () => {
      audioRef?.pause();
      bgSoundSub();
      sessionStoreSub();
    };
  });

  async function playIfSoundFileExists() {
    if (!src) return;
    const response = await fetch(src);
    if (response.status === 200) audioRef?.play();
    else {
      stopAudio();
    }
  }
  function stopAudio() {
    src = undefined;
    audioRef?.pause();
  }
</script>

<audio bind:this={audioRef} {src} loop />
