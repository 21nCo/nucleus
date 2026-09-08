import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import type {
  IResource,
  IResourceLabeled,
  IResourceShareable
} from "@nucleum/datafn/resource.type";

type IFileBase = IResourceLabeled & {
  type: string;
  name?: string;
  size: number;
  duration?: number;
  url?: string | null;
  data?: Uint8Array;
  thumbnailUrl?: string | null;
  thumbnailData?: Uint8Array;
  isMeta?: boolean;
};

export type IFileCapture = IFileBase & {
  id: IRecordId;
};

export type IFile = IResource & IResourceShareable & IFileBase;

export enum FileType {
  IMAGE = "image",
  VIDEO = "video",
  AUDIO = "audio",
  PDF = "application",
  UNKNOWN = "unknown"
}

export type IImageRepositionerOptions = {
  enabled?: boolean;
  axis?: "x" | "y";
  initialPosition?: number;
};

export type IFileEmbedChannel = {
  files: { id: string; data: any }[];
};
