import type { EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
export type IEmbedChannel = {
  [key: string]: IEmbedChannelData;
};

export type IEmbedChannelData = {
  type: EmbedMessage;
  data: any;
};
