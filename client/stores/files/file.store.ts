import { persistenceInstance } from "@nucleum/persistence/persistence";
import context from "@nucleum/stores/context.store";
import { toasts } from "@nucleum/stores/notification.store";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import { getBucketNameandKey, isUrlExpired } from "@21n/utils/account.utils";
import { get } from "svelte/store";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { isRecordId } from "@nucleum/datafn/resource.utils";
import type { IFile } from "@nucleum/stores/files/file.type";
import { fileEmbedChannel } from "@nucleum/stores/files/fileEmbedChannel.store";
import { OperatingSystem } from "@nucleum/client/runtime/context.type";
import { datafn } from "@nucleum/datafn/datafn.store";

function resolveBlobPart(data: Uint8Array<ArrayBufferLike>) {
  return Uint8Array.from(data).buffer;
}

class FileStore {
  private async select(fileId: IRecordId) {
    const result = await datafn.file.query({
      filters: { id: fileId }
    });
    return result.data?.[0] as IFile | undefined;
  }

  async download(file: IFile | IRecordId | string) {
    logger.log({ at: "fileStore - download", file });
    const defaultErrMessage = "Error downloading file. Please try again.";
    try {
      let _file: IFile | string | undefined;
      if (typeof file === "object" && ("url" in file || "data" in file))
        _file = file;
      else if (typeof file === "string" && file.includes("http")) _file = file;
      else {
        _file = await this.select(file as IRecordId);
        if (!_file) return;
      }
      if (!_file) return;
      if (typeof _file === "string") {
        const response = await fetch(_file);
        const blob = await response.blob();
        this.downloadFromBlob(blob, {
          fileName: "download"
        });
        return;
      }
      const contextStore = get(context);
      if (contextStore.isEmbed) {
        //TODO - handle offline user case
        if (!_file.url) return;
        fileEmbedChannel.downloadFromUrl(
          _file.url,
          (_file.label ?? _file.name ?? _file.id).split(".")[0]
        );
        if (contextStore.os === OperatingSystem.MACOS) {
          toasts.success("File downloaded to Downloads folder");
        }
        return;
      }
      let blob;
      try {
        if (_file.data) {
          blob = new Blob([resolveBlobPart(_file.data)], { type: _file.type });
        } else {
          if (!_file.url) return;
          const response = await fetch(_file.url);
          blob = await response.blob();
        }
      } catch (error: any) {
        toasts.error(defaultErrMessage);
        return;
      }
      if (!blob) {
        toasts.error(defaultErrMessage);
        return;
      }
      this.downloadFromBlob(blob, {
        fileName: _file.name || _file.label || "download",
        contentType: _file.type
      });
    } catch (error) {
      logger.error({ at: "fileStore - download", error });
      toasts.error(defaultErrMessage);
    }
  }

  async downloadFromBlob(
    blob: Blob,
    params?: {
      contentType?: string;
      fileName?: string;
      fileNameForEmbed?: string;
      isHandleEmbedCase?: boolean;
    }
  ) {
    if (get(context).isEmbed) {
      if (!params?.isHandleEmbedCase) return false;
      return fileEmbedChannel.downloadFromBlob(
        blob,
        params?.fileName || params?.fileNameForEmbed || "download",
        params?.contentType || blob.type || "application/octet-stream"
      );
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = params?.fileName || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    return true;
  }

  private async updateUrlIfExpired(
    file: IFile | IRecordId,
    params?: {
      isUseThumbnailIfAvailable?: boolean;
    }
  ): Promise<IFile | undefined> {
    if (typeof file !== "object" || !("url" in file) || !file.url) return;

    if (
      params?.isUseThumbnailIfAvailable &&
      file.thumbnailUrl &&
      isUrlExpired(file.thumbnailUrl)
    ) {
      let key = getBucketNameandKey(file.thumbnailUrl);
      let signedUrl = await persistenceInstance.fetchSignedUrlForGet(key);
      return { ...file, thumbnailUrl: signedUrl?.getUrl };
    } else if (isUrlExpired(file.url)) {
      let key = getBucketNameandKey(file.url);
      let signedUrl = await persistenceInstance.fetchSignedUrlForGet(key);
      return { ...file, url: signedUrl?.getUrl };
    } else return file;
  }

  /**
   * Updates the url if expired, replaces url with data url if data is present.
   * @param file
   * @returns a promise of file or undefined
   */
  async refresh(
    file: IFile | IRecordId,
    params?: {
      isUseThumbnailIfAvailable?: boolean;
    }
  ): Promise<IFile | undefined> {
    try {
      logger.log({ at: "fileStore - refresh", file });
      if (!file) return;
      if (typeof file === "string" && isRecordId(file)) {
        const _file = await this.select(file as IRecordId);
        if (!_file) return;
        file = _file;
      }
      if (
        params?.isUseThumbnailIfAvailable &&
        typeof file === "object" &&
        "thumbnailData" in file &&
        file.thumbnailData
      ) {
        return {
          ...file,
          thumbnailUrl: URL.createObjectURL(
            new Blob([resolveBlobPart(file.thumbnailData)], {
              type: "image/jpeg"
            })
          )
        };
      }
      if (typeof file === "object" && "data" in file && file.data) {
        return {
          ...file,
          url: URL.createObjectURL(
            new Blob([resolveBlobPart(file.data)], { type: file.type })
          )
        };
      }
      const response = await this.updateUrlIfExpired(file, params);
      if (!response) return;
      file = { ...response };
      return file;
    } catch (error) {
      logger.error({ at: "fileStore - refresh", error });
      return;
    }
  }
}

export const fileStore = new FileStore();
