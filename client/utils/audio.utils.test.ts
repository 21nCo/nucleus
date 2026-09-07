import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampAndConvertSample,
  convertFloat32ArrayToWav,
  writeString,
  writeWavHeader
} from "@21n/shared-utils/audio.utils";
import { convertAudioBufferToWav, convertWebMToWav } from "@nucleum/client/runtime/audio/audio.utils";

describe("client/utils/audio.utils", () => {
  let originalAudioContext: typeof AudioContext | undefined;

  beforeEach(() => {
    originalAudioContext = (globalThis as any).AudioContext;
  });

  afterEach(() => {
    (globalThis as any).AudioContext = originalAudioContext;
    vi.resetAllMocks();
  });

  it("writes strings into a DataView", () => {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    writeString(view, 2, "AB");

    expect(view.getUint8(2)).toBe("A".charCodeAt(0));
    expect(view.getUint8(3)).toBe("B".charCodeAt(0));
  });

  it("writes WAV header with correct metadata", () => {
    const buffer = new ArrayBuffer(64);
    const view = new DataView(buffer);
    const bytesWritten = writeWavHeader(
      view,
      { sampleRate: 16000, numberOfChannels: 1, bitsPerSample: 16 },
      32
    );

    expect(bytesWritten).toBe(44);
    expect(view.getUint32(4, true)).toBe(36 + 32);
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16000);
  });

  it("clamps and converts PCM samples", () => {
    expect(clampAndConvertSample(2)).toBe(0x7fff);
    expect(clampAndConvertSample(-2)).toBeCloseTo(-0x8000, 0);
    expect(clampAndConvertSample(0.5)).toBeCloseTo(0.5 * 0x7fff);
  });

  it("converts Float32Array to WAV buffer", () => {
    const samples = new Float32Array([0, 0.5, -0.5]);
    const wav = convertFloat32ArrayToWav(samples, 8000);
    const view = new DataView(wav);

    expect(view.getUint32(0, false)).toBe(0x52494646); // "RIFF"
    expect(view.getUint32(24, true)).toBe(8000);
    expect(view.getInt16(44, true)).toBe(0);
    expect(view.getInt16(46, true)).toBe(Math.trunc(0.5 * 0x7fff));
    expect(view.getInt16(48, true)).toBe(Math.trunc(-0.5 * 0x8000));
  });

  it("converts AudioBuffer instances to WAV", () => {
    const channelA = new Float32Array([0.25, -0.25]);
    const channelB = new Float32Array([0.75, -0.75]);
    const audioBuffer = {
      sampleRate: 44100,
      numberOfChannels: 2,
      length: 2,
      getChannelData: vi.fn((channel: number) =>
        channel === 0 ? channelA : channelB
      )
    } as unknown as AudioBuffer;

    const wav = convertAudioBufferToWav(audioBuffer);
    const view = new DataView(wav);

    expect(view.getUint32(24, true)).toBe(44100);
    expect(view.getInt16(44, true)).toBe(Math.trunc(0.25 * 0x7fff));
    expect(view.getInt16(46, true)).toBe(Math.trunc(0.75 * 0x7fff));
    expect(view.getInt16(48, true)).toBe(Math.trunc(-0.25 * 0x8000));
    expect(view.getInt16(50, true)).toBe(Math.trunc(-0.75 * 0x8000));
  });

  it("converts WebM blobs to WAV blobs", async () => {
    const channel = new Float32Array([0.1]);
    const mockAudioBuffer = {
      sampleRate: 16000,
      numberOfChannels: 1,
      length: 1,
      getChannelData: vi.fn(() => channel)
    } as unknown as AudioBuffer;

    const decodeAudioData = vi.fn(async () => mockAudioBuffer);
    class MockAudioContext {
      decodeAudioData = decodeAudioData;
    }

    (globalThis as any).AudioContext = MockAudioContext as any;

    const blob = {
      arrayBuffer: async () => new ArrayBuffer(4)
    } as unknown as Blob;

    const result = await convertWebMToWav(blob);

    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe("audio/wav");
    expect(result.size).toBeGreaterThan(0);
    expect(decodeAudioData).toHaveBeenCalledTimes(1);
  });
});
