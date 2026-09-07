<script lang="ts">
  import WaveSurfer from "wavesurfer.js";
  import { retrieveCurrentColors } from "@21n/utils/theme.utils";
  import appearance from "@nucleum/stores/appearance.store";
  import { onMount } from "svelte";
  import { parseBlob } from "music-metadata";
  import { onDestroy } from "svelte";
  import context from "@nucleum/stores/context.store";
  let { url = "" }: { url?: string } = $props();
  let imageUrl: string | null = null;
  let showWaveform = true;
  let dev_isTryArtworkFallback = false;

  onMount(async () => {
    if (!$context.isEmbed && dev_isTryArtworkFallback) {
      await loadArtworkUsingMetadata();
    }
    if (!imageUrl || showWaveform) {
      setTimeout(() => {
        renderAudioPreview();
      }, 1000);
    }
  });

  const currentColors: any = retrieveCurrentColors($appearance);
  const generator = randomLowercaseStringGenerator(15);
  const id = generator.next().value + "audioPreview";

  function renderAudioPreview() {
    if (!url) return;
    try {
      const wavesurfer = WaveSurfer.create({
        container: `#${id}`,
        waveColor: currentColors["aps1"],
        progressColor: currentColors["aps1"],
        cursorColor: currentColors["aps1"],
        url
      });
    } catch (error) {
      console.error(error);
    }
  }

  function* randomLowercaseStringGenerator(length = 10) {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";

    while (true) {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += alphabet[Math.floor(Math.random() * alphabet.length)];
      }
      yield result;
    }
  }

  async function tryLoadArtwork() {
    try {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = url;

      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          setTimeout(resolve, 100);
        };
        audio.onerror = () => resolve(null);
      });

      if ("mediaSession" in navigator && audio.duration > 0) {
        const response = await fetch(url);
        const blob = await response.blob();
        imageUrl = URL.createObjectURL(blob);
        showWaveform = false;
      }
    } catch (error) {
      console.error("Error loading artwork:", error);
      showWaveform = true;
    }
  }

  async function loadArtworkUsingMetadata() {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const metadata = await parseBlob(blob);
      if (metadata?.common?.picture) {
        const imageData = metadata.common.picture[0].data;
        const artworkBuffer = new Uint8Array(imageData.byteLength);
        artworkBuffer.set(imageData);
        imageUrl = URL.createObjectURL(new Blob([artworkBuffer.buffer]));
        showWaveform = false;
      }
    } catch (error) {
      console.error("Error loading artwork:", error);
      showWaveform = true;
    }
  }

  onDestroy(() => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  });
</script>

<div class="w-full h-full flex justify-center items-center">
  {#if imageUrl && !showWaveform}
    <img
      src={imageUrl}
      alt="Audio artwork"
      class="w-full h-full object-contain"
    />
  {:else}
    <div {id} class="w-full" />
  {/if}
</div>
