import type { EmbedMessage } from "@nucleum/application/embed/embedMessage.enum";
export type IEmbedChannel = {
  [key: string]: IEmbedChannelData;
};

export type IEmbedChannelData = {
  type: EmbedMessage;
  data: any;
};
