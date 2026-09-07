<script lang="ts">
  import type { IAudioMetadata } from "@nucleum/features/memory/node/node.type";
  import { formatSeconds } from "@21n/utils/time.utils";
  import BasicInfoItem from "@nucleum/features/memory/node/metadata/BasicInfoItem.svelte";
  let {
    metadata,
    duration = undefined
  }: {
    metadata: IAudioMetadata;
    duration?: number | undefined;
  } = $props();
</script>

<div class="flex flex-col gap-3 rounded-md mo:p-2 p-4 w-full bg-bgs2">
  <BasicInfoItem
    label="Duration"
    value={duration
      ? formatSeconds(duration)
      : metadata?.duration
        ? formatSeconds(metadata.duration)
        : "NA"}
  />
  {#if metadata?.title}
    <BasicInfoItem label="Title" value={metadata?.title} />
  {/if}
  {#if metadata?.album}
    <BasicInfoItem label="Album" value={metadata?.album} />
  {/if}
  {#if metadata?.artist}
    <BasicInfoItem label="Artist" value={metadata?.artist} />
  {/if}
  {#if metadata?.genre}
    <BasicInfoItem label="Genre" value={metadata?.genre} />
  {/if}
  {#if metadata?.composer}
    <BasicInfoItem label="Composer" value={metadata?.composer} />
  {/if}
  {#if metadata?.year}
    <BasicInfoItem label="Year" value={metadata?.year} />
  {/if}
  {#if metadata?.sampleRate}
    <BasicInfoItem label="Sample rate" value={metadata?.sampleRate} />
  {/if}
  {#if metadata?.bitrate}
    <BasicInfoItem label="Bitrate" value={metadata?.bitrate} />
  {/if}
  {#if metadata?.numberOfChannels}
    <BasicInfoItem label="Channels" value={metadata?.numberOfChannels} />
  {/if}
  {#if metadata?.codec}
    <BasicInfoItem label="Codec" value={metadata?.codec} />
  {/if}
  {#if metadata?.copyright}
    <BasicInfoItem label="Copyright" value={metadata?.copyright} />
  {/if}
</div>
