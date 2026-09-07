<script>
  import { backgroundSoundStore } from "@nucleum/features/focus/backgroundMusic/background-sound.store";
  import ComingSoonView from "@21n/elements/ComingSoonView.svelte";
  import Button from "@21n/elements/button/Button.svelte";
  import TextInput from "@21n/elements/input/TextInput.svelte";
  import Text from "@21n/elements/text/Text.svelte";
  import { Size } from "@21n/elements/size.enum";
  import { TextStyle } from "@21n/elements/text/text.enum";
  import SystemSounds from "@nucleum/features/focus/backgroundMusic/SystemSounds.svelte";
  let youtubeUrl = $backgroundSoundStore.youtubeUrl;
</script>

<div class="flex flex-col gap-16 items-start w-full h-full">
  <!-- <div>
    <Text style={TextStyle.SECTION_HEADING} content="Recents" />
  </div> -->
  <!-- TODO - volume functionality -->
  <!-- <div class="flex flex-col items-start">
    Recently played
    <div class="text-b3 text-fgs3">Not available</div>
  </div> -->
  <div class="flex flex-col w-full gap-4 items-start">
    <Text style={TextStyle.SECTION_HEADING} content="System" />
    <div class="w-full overflow-x-auto">
      <SystemSounds bind:selectedSound={$backgroundSoundStore.systemSound} />
    </div>
  </div>
  <!-- <div class="flex flex-col w-full gap-4 items-start">
    <Text style={TextStyle.SECTION_HEADING} content="Youtube" />
    <div class="flex flex-col gap-2 w-full items-center">
      <TextInput
        bind:value={youtubeUrl}
        placeholder="Paste a youtube URL here"
        label="Youtube URL for a music video or playlist"
      />
      <div class="flex gap-4">
        <Button
          icon="play"
          label="play"
          size={Size.sm}
          onclick={() => {
            if (!youtubeUrl) return;
            backgroundSoundStore.playYoutube(youtubeUrl);
          }}
        />
        <Button
          icon="sync"
          label="reset"
          size={Size.sm}
          onclick={() => {
            youtubeUrl = "";
            backgroundSoundStore.resetYoutube();
          }}
        />
      </div>
    </div>
  </div> -->
  <div class="flex flex-col w-full grow gap-4 items-start">
    <Text style={TextStyle.SECTION_HEADING} content="Spotify" />
    <div class="flex w-full grow justify-center">
      <ComingSoonView
        size={Size.sm}
        subText="Spotify integration will be available soon.."
      />
    </div>
  </div>
</div>
