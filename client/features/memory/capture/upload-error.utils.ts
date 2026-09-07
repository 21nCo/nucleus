/** Formats file-upload rejection reasons for the capture UI. */
export function resolveFileUploadErrorMessage(
  errors: { file: File; type: string }[],
  params?: {
    maxFileSizeMB?: number;
  }
) {
  let error = "";
  errors.forEach((err) => {
    error = (error ? error + ", " : "") + resolveErroLabel(err.file, err.type);
  });
  return error;

  function resolveErroLabel(file: File, type: string) {
    let error = "";
    if (type === "type") {
      const extension = file.name.split(".").pop();
      error = `File type .${extension} not supported`;
    } else if (type === "size") {
      error = `File size exceeds the maximum limit of ${
        params?.maxFileSizeMB
      }MB`;
    }
    return error;
  }
}
