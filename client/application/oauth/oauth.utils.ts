import { performApiCall } from "@21n/utils/network.utils";

export async function handleOAuthRedirection(
  slug: string,
  code: string | null
) {
  if (!slug || !code) return;
  const app = import.meta.env?.VITE_HOST ?? window.location.hostname;
  const verifier = sessionStorage.getItem("verifier");
  const body = {
    slug,
    code,
    verifier,
    app
  };
  let response = await performApiCall("account/n/oauth", "POST", body);
  console.log(response);
  if (response) {
    if (response.status === 200) {
      return response;
    }
  }
  return null;
}
