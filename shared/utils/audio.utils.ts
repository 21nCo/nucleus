export interface WavConfig {
  sampleRate: number;
  numberOfChannels: number;
  bitsPerSample: number;
}

export function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export function writeWavHeader(
  view: DataView,
  config: WavConfig,
  dataSize: number
): number {
  let offset = 0;
  const { sampleRate, numberOfChannels, bitsPerSample } = config;

  // RIFF header
  writeString(view, offset, "RIFF");
  offset += 4;
  view.setUint32(offset, 36 + dataSize, true);
  offset += 4;
  writeString(view, offset, "WAVE");
  offset += 4;

  // fmt chunk
  writeString(view, offset, "fmt ");
  offset += 4;
  view.setUint32(offset, 16, true); // fmt chunk size
  offset += 4;
  view.setUint16(offset, 1, true); // PCM format
  offset += 2;
  view.setUint16(offset, numberOfChannels, true);
  offset += 2;
  view.setUint32(offset, sampleRate, true);
  offset += 4;
  view.setUint32(
    offset,
    (sampleRate * numberOfChannels * bitsPerSample) / 8,
    true
  ); // byte rate
  offset += 4;
  view.setUint16(offset, (numberOfChannels * bitsPerSample) / 8, true); // block align
  offset += 2;
  view.setUint16(offset, bitsPerSample, true); // bits per sample
  offset += 2;

  // data chunk header
  writeString(view, offset, "data");
  offset += 4;
  view.setUint32(offset, dataSize, true);
  offset += 4;

  return offset;
}

export function clampAndConvertSample(sample: number): number {
  const clamped = Math.max(-1, Math.min(1, sample));
  return clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
}

export function convertFloat32ArrayToWav(
  audioData: Float32Array,
  sampleRate: number = 16000
): ArrayBuffer {
  const config: WavConfig = {
    sampleRate,
    numberOfChannels: 1,
    bitsPerSample: 16
  };

  const dataSize = audioData.length * 2; // 16-bit samples
  const bufferSize = 44 + dataSize;
  const buffer = new ArrayBuffer(bufferSize);
  const view = new DataView(buffer);

  const dataOffset = writeWavHeader(view, config, dataSize);

  // Write audio data
  for (let i = 0; i < audioData.length; i++) {
    const convertedSample = clampAndConvertSample(audioData[i]);
    view.setInt16(dataOffset + i * 2, convertedSample, true);
  }

  return buffer;
}
