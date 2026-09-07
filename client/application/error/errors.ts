import { ResourceErrorCode } from "@nucleum/schema/resource-error.enum";

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
