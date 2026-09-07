import type { EmbedMessage } from "@21n/types/embedMessage.enum";
export type IEmbedChannel = {
  [key: string]: IEmbedChannelData;
};

export type IEmbedChannelData = {
  type: EmbedMessage;
  data: any;
};
