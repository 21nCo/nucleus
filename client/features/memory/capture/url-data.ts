import { performApiCall } from "@21n/utils/network.utils";
import {
  isContentScript,
  isExtensionEnvironment
} from "@21n/utils/browser.utils";
import { extractFullTabData } from "@nucleum/extensions/clipper/clipper.utils";
import { resolveJsonResponse } from "@nucleum/persistence/response.utils";

/** Retrieves remote page data and applies memory capture parsing unless raw data is requested. */
export async function retrieveUrlData(
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
    const jsonResponse = resolveJsonResponse(response);
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
