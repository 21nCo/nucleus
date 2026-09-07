export enum TranscriptionModel {
  TINY_EN = "tiny.en",
  BASE_EN = "base.en",
  SMALL_EN = "small.en",
  MEDIUM_EN = "medium.en",
  DISTILL_SMALL_EN = "distil-small.en"
}

export interface IJobStatus {
  status: "running" | "completed" | "failed";
  output?: unknown;
  progress?: number;
  error?: string;
}
