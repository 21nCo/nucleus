import { EmbedDataMessage } from "@21n/types/embedMessage.enum";
import { postDataToParent } from "@21n/utils/embed.utils";
import { wait } from "@21n/utils/time.utils";
import { type IFileEmbedChannel } from "@nucleum/features/files/file.type";
import { get, writable } from "svelte/store";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";

const subject = writable<IFileEmbedChannel>({ files: [] });
const pendingDownloads = new Map<
  string,
  { resolve: (value: boolean) => void; timeout: ReturnType<typeof setTimeout> }
>();

function requestDownload(payload: {
  url?: string;
  data?: string;
  contentType?: string;
  filename?: string;
}) {
  const id = generateSimpleRandomId();
  return new Promise<boolean>((resolve) => {
    const timeout = setTimeout(() => {
      pendingDownloads.delete(id);
      resolve(false);
    }, 300_000);
    pendingDownloads.set(id, { resolve, timeout });
    postDataToParent(EmbedDataMessage.DOWNLOAD, { id, ...payload });
  });
}

function uint8ArrayToBase64(bytes: Uint8Array) {
  const chunkSize = 32768;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

export const fileEmbedChannel = {
  get: () => get(subject),
  subscribe: subject.subscribe,
  update: subject.update,
  set: subject.set,
  async fetch(url: string, id: string) {
    const currentStore = get(subject);
    let file = currentStore.files.find((f) => f.id === id);
    if (file) return file.data;

    postDataToParent(EmbedDataMessage.FETCH, {
      url: url.toString(),
      id
    });

    let isDataReceived = false;
    let timeElapsed = 0;
    while (!isDataReceived) {
      if (timeElapsed > 5000) {
        throw new Error("Timeout waiting for data");
      }
      const latestStore = get(subject);
      file = latestStore.files.find((f) => f.id === id);
      if (file) {
        isDataReceived = true;
        break;
      }
      await wait(500);
      timeElapsed += 500;
    }

    if (!file) return;
    return file.data;
  },

  downloadFromUrl(url: string, fileName?: string) {
    return requestDownload({
      url: url.toString(),
      filename: fileName
    });
  },

  async downloadFromBlob(blob: Blob, fileName?: string, contentType?: string) {
    const data = uint8ArrayToBase64(new Uint8Array(await blob.arrayBuffer()));
    return requestDownload({
      data,
      contentType: contentType ?? blob.type,
      filename: fileName
    });
  },

  setDownloadResult(id: string, success: boolean) {
    const pending = pendingDownloads.get(id);
    if (!pending) return;
    clearTimeout(pending.timeout);
    pendingDownloads.delete(id);
    pending.resolve(success);
  },

  download(data: string, contentType: string) {
    postDataToParent(EmbedDataMessage.DOWNLOAD, {
      data,
      contentType
    });
  },

  setFile(id: string, data: string) {
    const currentStore = get(subject);
    const files = currentStore.files.filter((f) => f.id !== id);
    files.push({ id, data });
    subject.set({ files });
  },

  base64ToUint8Array,
  /**
   * TODO - use ui.utils.ts base64ToBlob instead
   * */
  base64ToBlob(base64: string, type: string): Blob {
    const uint8Array = base64ToUint8Array(base64);
    const arrayBuffer = uint8Array.buffer.slice(0) as ArrayBuffer;
    return new Blob([arrayBuffer], { type });
  }
};
