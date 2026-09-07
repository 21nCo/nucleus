import { ResourceErrorCode } from "@nucleum/components/error/error.type";

export class ResourceError extends Error {
  constructor(
    message: string,
    public code: ResourceErrorCode
  ) {
    super(message);
    this.name = "ResourceError";
    this.code = code;
  }
}
