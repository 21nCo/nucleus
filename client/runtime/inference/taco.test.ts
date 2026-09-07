import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Taco } from "./taco";
import { TranscriptionModel } from "./worker.type";

const mocks = vi.hoisted(() => ({ native: vi.fn(), fetch: vi.fn() }));
vi.mock("@nucleum/client/runtime/embed/embed.store", () => ({
  embedBridge: { fetch: mocks.native }
}));
vi.mock("@nucleum/client/runtime/logging/logger", () => ({
  logger: { log: vi.fn(), error: vi.fn() }
}));
const taco = Taco.getInstance();

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetch);
});
afterEach(() => vi.unstubAllGlobals());

describe("inference service contracts", () => {
  it.each([undefined, "", "base"])(
    "preserves native transcription model selection for %s",
    async (model) => {
      mocks.native.mockResolvedValue("synthetic-job");
      await expect(
        taco.initiateTranscriptionUsingCoreML(
          "https://example.test/audio.wav",
          { model }
        )
      ).resolves.toBe("synthetic-job");
      expect(mocks.native).toHaveBeenCalledWith(
        expect.any(String),
        "TRANSCRIBE_AUDIO",
        {
          url: "https://example.test/audio.wav",
          model: model || "tiny",
          enableTimestamps: true,
          enableImprovedFormatting: true
        }
      );
    }
  );

  it("rejects an empty transcription response", async () => {
    mocks.native.mockResolvedValue(null);
    await expect(
      taco.initiateTranscriptionUsingCoreML("https://example.test/audio.wav")
    ).rejects.toThrow("Failed to get transcription job ID");
  });

  it("passes through job status and uses the supplied job id", async () => {
    const status = { status: "running", progress: 0.25 };
    mocks.native.mockResolvedValue(status);
    await expect(taco.retrieveJob("synthetic-job")).resolves.toBe(status);
    expect(mocks.native).toHaveBeenCalledWith(
      expect.any(String),
      "RETRIEVE_JOB",
      { jobId: "synthetic-job" }
    );
  });

  it("rejects an empty job response", async () => {
    mocks.native.mockResolvedValue(undefined);
    await expect(taco.retrieveJob("synthetic-job")).rejects.toThrow(
      "Failed to get job status"
    );
  });

  it("returns the download request id after the host acknowledges it", async () => {
    let acknowledge!: () => void;
    mocks.native.mockReturnValue(
      new Promise<void>((resolve) => {
        acknowledge = resolve;
      })
    );
    const request = taco.downloadModel("transcription", "small");
    expect(mocks.native).toHaveBeenCalledWith(
      expect.any(String),
      "DOWNLOAD_MODEL",
      { type: "transcription", model: "small" }
    );
    const id = mocks.native.mock.calls[0][0];
    acknowledge();
    await expect(request).resolves.toBe(id);
  });

  it("propagates native transport failures", async () => {
    const error = new Error("Host unavailable");
    mocks.native.mockRejectedValue(error);
    await expect(taco.downloadModel("transcription", "tiny")).rejects.toBe(
      error
    );
  });

  it("preserves the local inference endpoint and WAV form fields", async () => {
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ text: "Synthetic transcript" })
    });
    await expect(
      taco.generateTranscriptUsingLmStudio(new Float32Array([0, -1, 1]))
    ).resolves.toBe("Synthetic transcript");
    const [url, options] = mocks.fetch.mock.calls[0];
    expect(url).toBe("http://localhost:1234/v1/models");
    expect(options.method).toBe("POST");
    expect(options.body.get("model")).toBe(TranscriptionModel.BASE_EN);
    const file = options.body.get("file");
    expect(file.type).toBe("audio/wav");
    expect(file.size).toBe(50);
  });

  it("propagates local inference HTTP failures", async () => {
    mocks.fetch.mockResolvedValue({ ok: false, status: 503 });
    await expect(
      taco.generateTranscriptUsingLmStudio(new Float32Array())
    ).rejects.toThrow("HTTP error! status: 503");
  });
});
