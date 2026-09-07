import {
  EmbedDataMessage,
  type EmbedMessage
} from "@nucleum/client/runtime/embed/embedMessage.enum";
import { postDataToParent } from "@nucleum/client/runtime/embed/embed.utils";
import { wait } from "@21n/shared-utils/wait";
import type { IEmbedChannel } from "@nucleum/client/runtime/embed/embed.type";
import { get, writable } from "svelte/store";

const subject = writable<IEmbedChannel>({});

export const embedBridge = {
  get: () => get(subject),
  subscribe: subject.subscribe,
  update: subject.update,
  set: subject.set,
  async fetch(id: string, type: EmbedMessage, body: any) {
    const store = this.get();
    let item = store[id];
    if (item) return item.data;

    postDataToParent(EmbedDataMessage.DATA, { id, type, body });

    let isDataReceived = false;
    let timeElapsed = 0;
    while (!isDataReceived) {
      if (timeElapsed > 5000) {
        throw new Error("Timeout waiting for data");
      }
      const store = this.get();
      item = store[id];
      if (item) {
        isDataReceived = true;
        break;
      }
      await wait(500);
      timeElapsed += 500;
    }

    if (!item) return;
    return item.data;
  },

  setData(id: string, type: EmbedMessage, data: any) {
    const store = this.get();
    store[id] = { type, data };
    subject.set(store);
  }
};
