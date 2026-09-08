type JsonResponse = Pick<Response, "ok" | "json">;

/** Recognizes response objects returned by legacy browser and extension transports. */
function isJsonResponse(response: unknown): response is JsonResponse {
  if (!response || typeof response !== "object") return false;
  const candidate = response as {
    ok?: unknown;
    json?: unknown;
  };
  return (
    typeof candidate.ok === "boolean" && typeof candidate.json === "function"
  );
}

/** Accepts only fetch-like JSON responses from legacy transport adapters. */
export function resolveJsonResponse(response: unknown) {
  if (!isJsonResponse(response)) return;
  return response;
}
