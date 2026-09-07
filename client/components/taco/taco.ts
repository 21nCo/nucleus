import { logger } from "@nucleum/client/runtime/logging/logger";
import { embedBridge } from "@nucleum/components/embed/embed.store";
import { EmbedMessage } from "@21n/types/embedMessage.enum";
import { generateMiniRandomId } from "@21n/shared-utils/crypto.utils";
import { convertFloat32ArrayToWav } from "@21n/utils/audio.utils";
import { TranscriptionModel } from "@nucleum/products/memotron/taco/taco.types";
import type { IJobStatus } from "@nucleum/components/taco/taco.type";

export class Taco {
  private static instance: Taco;
  //   private lmStudioUrl: string = "http://localhost:1234/v1/audio/transcriptions";
  private lmStudioUrl: string = "http://localhost:1234/v1/models";

  private constructor() {}

  public static getInstance(): Taco {
    if (!Taco.instance) {
      Taco.instance = new Taco();
    }
    return Taco.instance;
  }

  /**
   * Generates a transcript from audio using LM Studio's Whisper model
   * @param audioData - The audio data to transcribe (Float32Array)
   * @param model - The Whisper model to use (defaults to base.en)
   * @returns Promise<string> - The transcribed text
   */
  public async generateTranscriptUsingLmStudio(
    audioData: Float32Array,
    model: TranscriptionModel = TranscriptionModel.BASE_EN
  ): Promise<string> {
    try {
      logger.log({
        at: "Taco.generateTranscript",
        model,
        audioDataSize: audioData.length
      });

      // Convert Float32Array to WAV format
      const wavBuffer = convertFloat32ArrayToWav(audioData);

      const formData = new FormData();
      formData.append("file", new Blob([wavBuffer], { type: "audio/wav" }));
      formData.append("model", model);

      const response = await fetch(this.lmStudioUrl, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      logger.error({
        at: "Taco.generateTranscript",
        error
      });
      throw error;
    }
  }

  /**
   * Initiates audio transcription using iOS ML service
   * @param audioData - The audio data to transcribe (Float32Array)
   * @returns Promise<string> - The job ID for tracking transcription progress
   */
  public async initiateTranscriptionUsingCoreML(
    url: string,
    params?: {
      model?: string;
    }
  ): Promise<unknown> {
    try {
      logger.log({
        at: "Taco.initiateTranscriptionUsingML",
        url
      });
      const result = await embedBridge.fetch(
        generateMiniRandomId(),
        EmbedMessage.TRANSCRIBE_AUDIO,
        {
          url,
          model: params?.model || "tiny",
          enableTimestamps: true,
          enableImprovedFormatting: true
        }
      );
      if (!result) {
        throw new Error("Failed to get transcription job ID");
      }
      return result;
    } catch (error) {
      logger.error({
        at: "Taco.initiateTranscriptionUsingML",
        error
      });
      throw error;
    }
  }

  /**
   * Checks the status of a transcription job
   * @param jobId - The ID of the transcription job to check
   * @returns Promise<TranscriptionStatus> - The current status of the transcription
   */
  public async retrieveJob(jobId: string): Promise<IJobStatus> {
    try {
      logger.log({
        at: "Taco.retrieveJob",
        jobId
      });

      const result = await embedBridge.fetch(
        generateMiniRandomId(),
        EmbedMessage.RETRIEVE_JOB,
        { jobId }
      );

      if (!result) {
        throw new Error("Failed to get job status");
      }

      return result as IJobStatus;
    } catch (error) {
      logger.error({
        at: "Taco.retrieveJob",
        error
      });
      throw error;
    }
  }

  /**
   * Downloads a transcription model
   * @param type - The type of model to download (transcription, summarization, etc.)
   * @param model - The name of the model to download
   * @returns Promise<string> - The ID of the download operation
   */
  public async downloadModel(type: string, model: string): Promise<string> {
    try {
      logger.log({
        at: "Taco.downloadModel",
        model
      });
      const id = generateMiniRandomId();
      await embedBridge.fetch(id, EmbedMessage.DOWNLOAD_MODEL, {
        type,
        model
      });
      return id;
    } catch (error) {
      logger.error({
        at: "Taco.downloadModel",
        error
      });
      throw error;
    }
  }
}
