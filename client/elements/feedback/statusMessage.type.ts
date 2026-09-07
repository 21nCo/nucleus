export type StatusMessage = {
  message: string | undefined;
  type: StatusMessageType;
};

export enum StatusMessageType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
  DEFAULT = "default"
}
