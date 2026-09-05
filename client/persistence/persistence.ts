import {
  performApiCall,
  performStaticDataOperation
} from "@21n/utils/network.utils";
import { logger } from "@21n/components/debug/logger.client";
import { clientStorage } from "@21n/persistence/persistence.utils";
import { ClientStorageKey } from "@21n/persistence/persistence.type";
import { extractFullTabData } from "@21n/extensions/clipper/clipper.utils";
import {
  isContentScript,
  isExtensionEnvironment
} from "@21n/utils/browser.utils";
import { parse } from "@21n/shared-utils/json.utils";

type JsonResponse = Pick<Response, "ok" | "json">;

function isJsonResponse(response: unknown): response is JsonResponse {
  if (!response || typeof response !== "object") return false;
  const candidate = response as {
    ok?: unknown;
    json?: unknown;
  };
  return typeof candidate.ok === "boolean" && typeof candidate.json === "function";
}

export class Persistence {
  private resolveJsonResponse(response: unknown) {
    if (!isJsonResponse(response)) return;
    return response;
  }

  getUserInfo = async (token: string) => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("account/n/refresh", "POST", {
          token
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      if (!data?.userInfo) return;
      return data;
    } catch (err) {
      logger.error({ at: "getUserInfo", error: err });
    }
  };
  getUserPlan = async () => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("v2/plan/get", "POST", {})
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "getUserPlan", error: err });
    }
  };

  initiateSubscription = async (params: any) => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("v2/plan/subscribe", "POST", {
          ...params
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "initiateSubscription", error: err });
    }
  };

  modifySubscription = async (params: any) => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("v2/plan/modify", "POST", {
          ...params
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "modifySubscription", error: err });
    }
  };

  restorePurchase = async () => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("v2/plan/restore", "POST", {})
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "restorePurchase", error: err });
    }
  };

  verifyPayment = async (nonce: string, embedTransaction?: any) => {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("v2/plan/verify", "POST", {
          nonce,
          embedTransaction
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "verifyPayment", error: err });
    }
  };

  async runAccountAction(action: string, params: any) {
    try {
      const apiBaseUrl =
        import.meta.env?.VITE_API_URL ??
        (typeof process !== "undefined"
          ? process.env?.PLASMO_PUBLIC_API_URL
          : undefined);
      if (!apiBaseUrl) {
        return;
      }
      const response = this.resolveJsonResponse(
        await performApiCall("account/n/action", "POST", {
          action,
          ...params
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "runAccountAction", error: err });
    }
  }
  async runGeoAction(method: string, params: any) {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall("utils/n/geo", "POST", {
          method,
          ...params
        })
      );
      if (!response?.ok) {
        return;
      }
      const data = await response.json();
      return data;
    } catch (err) {
      logger.error({ at: "runGeoAction", error: err });
    }
  }
  fetchAppData = async (env: string) => {
    try {
      const product = await clientStorage.get(ClientStorageKey.PRODUCT);
      if (!product) return;
      let response = await performStaticDataOperation(`${product}/${env}.json`);
      if (response?.ok) {
        let jsonValue = await response.json();
        if (!jsonValue) return;
        return jsonValue;
      }
    } catch (err) {
      throw err;
    }
  };

  async getSignedUrl(
    userId: string,
    contentType: string,
    fileName: string,
    isTemp: boolean
  ) {
    try {
      const response = this.resolveJsonResponse(
        await performApiCall(
          "utils/n/getsignedurl",
          "POST",
          {
            method: "PUT",
            contentType,
            fileName,
            userId,
            isTemp
          },
          { isFileApi: true }
        )
      );
      return await response?.json();
    } catch (e) {
      logger.error({ at: "getSignedUrl", error: e });
    }
  }
  /**
   *
   * @param key key of the file including the bucket name and content type.
   * {bucket}/{userId}/{contentType}/{fileName}
   *
   * Examples:
   * tidyfilesdevsix.ap-south-1/m2d1y865ab801iq3fm4o9e2g/image/6fe1e59f-0554-4234-b7b6-366125ca0870_Chromewebstore.png
   *
   * @returns response {error?: string, url?: string}
   * If the authenticated user id does not match the userId in the key, the request will fail.
   *
   */
  async fetchSignedUrlForGet(key: string) {
    const response = this.resolveJsonResponse(
      await performApiCall(
        "utils/n/getsignedurl",
        "POST",
        {
          method: "GET",
          key
        },
        { isFileApi: true }
      )
    );
    return await response?.json();
  }
  async uploadFile(uploadUrl: string, contentType: string, blob: any) {
    const result = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": contentType
        // "x-amz-acl": "public-read"
      }
    });
    if (result.status === 200) {
      return uploadUrl;
    } else {
      return null;
    }
  }

  async retrieveUrlData(
    url: string,
    params?: {
      isReturnRawData?: boolean;
    }
  ) {
    const response = await performApiCall("utils/n/run", "POST", {
      url,
      action: "get-webpage"
    });
    let data;
    const isExtentionContentScript = isContentScript();
    const isExtensionEnv = isExtensionEnvironment();
    if (isExtensionEnv && isExtentionContentScript) {
      if (!response) return;
      data = response;
    } else {
      const jsonResponse = this.resolveJsonResponse(response);
      if (!jsonResponse?.ok) return;
      data = await jsonResponse.json();
    }
    if (params?.isReturnRawData) {
      return data;
    }
    let parsedData = null;
    if (data?.text) {
      parsedData = await parseHtml(data.text);
    }
    return { ...data, parsedData };
    function parseHtml(html: string) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      return extractFullTabData(doc, {
        docText: html,
        url
      });
    }
  }

  async browseUnsplash(params?: {
    query?: string;
    page?: number;
    perPage?: number;
  }) {
    const response = this.resolveJsonResponse(
      await performApiCall("utils/n/run", "POST", {
        action: "unsplash-browse",
        ...params
      })
    );

    if (!response?.ok) return;
    const data = await response.json();
    return data;
  }

  async triggerUnsplashDownload(params?: { url: string }) {
    const response = this.resolveJsonResponse(
      await performApiCall("utils/n/run", "POST", {
        action: "unsplash-download",
        ...params
      })
    );

    if (!response?.ok) return;
    const data = await response.json();
    return data;
  }
}

export const persistenceInstance = new Persistence();
