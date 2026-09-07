import {
  type WavConfig,
  writeWavHeader,
  clampAndConvertSample
} from "@21n/shared-utils/audio.utils";

export function convertAudioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const config: WavConfig = {
    sampleRate: buffer.sampleRate,
    numberOfChannels: buffer.numberOfChannels,
    bitsPerSample: 16
  };

  const length = buffer.length;
  const dataSize = length * config.numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const dataOffset = writeWavHeader(view, config, dataSize);

  // Convert and write audio data
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < config.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      const convertedSample = clampAndConvertSample(channelData[i]);
      view.setInt16(
        dataOffset + (i * config.numberOfChannels + channel) * 2,
        convertedSample,
        true
      );
    }
  }

  return arrayBuffer;
}

export async function convertWebMToWav(webmBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext();
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const wavBuffer = convertAudioBufferToWav(audioBuffer);
  return new Blob([wavBuffer], { type: "audio/wav" });
}
