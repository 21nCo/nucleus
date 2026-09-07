import { resolveToken } from "$lib/client/utils/account.utils";
import { logger } from "$lib/client/components/debug/logger.client";
import type {
  WebArtifactCategory,
  WebArtifactSearchResult
} from "./webCapture.types";

const DEFAULT_ENDPOINT = "/api/web-artifacts";

function resolveBaseUrl(): string {
  const envUrl = import.meta.env?.VITE_WEB_ARTIFACT_SERVICE_URL;
  if (envUrl && typeof envUrl === "string" && envUrl.length > 0) {
    return envUrl.replace(/\/$/, "");
  }
  if (typeof window !== "undefined" && window.location) {
    return `${window.location.origin}${DEFAULT_ENDPOINT}`;
  }
  return DEFAULT_ENDPOINT;
}

function buildSearchUrl(
  baseUrl: string,
  category: WebArtifactCategory,
  query?: string,
  page?: number,
  limit?: number
): string {
  const isAbsolute = /^https?:\/\//i.test(baseUrl);
  let resolvedBase = baseUrl.replace(/\/$/, "");
  if (!isAbsolute) {
    if (typeof window !== "undefined") {
      resolvedBase = new URL(baseUrl, window.location.origin)
        .toString()
        .replace(/\/$/, "");
    } else {
      throw new Error("VITE_WEB_ARTIFACT_SERVICE_URL must be absolute for SSR/tests");
    }
  }
  const url = new URL("search", resolvedBase.endsWith("/") ? resolvedBase : `${resolvedBase}/`);
  url.searchParams.set("category", category);
  if (query !== undefined) url.searchParams.set("query", query);
  if (page !== undefined) url.searchParams.set("page", String(page));
  if (limit !== undefined) url.searchParams.set("limit", String(limit));
  return url.toString();
}

export class WebCaptureServiceError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "WebCaptureServiceError";
    this.status = status;
  }
}

export async function searchWebArtifacts(params: {
  category: WebArtifactCategory;
  query?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<WebArtifactSearchResult> {
  const { category, query, page, limit, signal } = params;
  const baseUrl = resolveBaseUrl();
  const url = buildSearchUrl(baseUrl, category, query, page, limit);

  const token = await resolveToken();
  if (!token) {
    throw new WebCaptureServiceError("User not authenticated", 401);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      },
      signal
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({
        at: "WebCaptureService.search",
        status: response.status,
        body: text
      });
      throw new WebCaptureServiceError(
        `Search failed with status ${response.status}`,
        response.status
      );
    }

    type ServiceResponse = {
      data: WebArtifactSearchResult;
      category: WebArtifactCategory;
      query?: string;
      fetchedAt: string;
    };

    const data = (await response.json()) as ServiceResponse;
    if (!data?.data) {
      throw new WebCaptureServiceError("Malformed response from service");
    }
    return data.data;
  } catch (error) {
    if (error instanceof WebCaptureServiceError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    logger.error({ at: "WebCaptureService.search", error });
    throw new WebCaptureServiceError("Unable to reach web capture service");
  }
}
