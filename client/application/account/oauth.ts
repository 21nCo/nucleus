import { navigation } from "@21n/layout/navigation/navigation";
import { get } from "svelte/store";

import { IdentityProvider } from "@nucleum/client/runtime/account/oauth.type";
import { goto } from "@21n/utils/browser.utils";
import { getDapId } from "@nucleum/persistence/persistence.utils";

import context from "@nucleum/stores/context.store";

import { OperatingSystem } from "@nucleum/client/runtime/context.type";

import { appStore } from "@nucleum/stores/app.store";

/** Starts the configured legacy OAuth flow for the application login route. */
export const oauth = {
  initiateOAuth2Flow: async (provider: IdentityProvider, guest?: string) => {
    const ctx = get(context);
    const app = get(appStore);
    const oAuthConfig = app.appData?.oAuthConfig;
    if (!oAuthConfig || oAuthConfig.length < 1) return;
    const config = oAuthConfig.find((c) => c.provider === provider);
    if (!config) return;
    const dev = import.meta.env?.DEV;
    const host =
      ctx.isEmbed || dev || window.location.hostname === "localhost"
        ? import.meta.env?.VITE_HOST
        : window.location.hostname;
    const guestPartForState = guest ?? (await getDapId()) ?? "";
    const domainPartForState =
      ctx.os === OperatingSystem.MACOS &&
      ctx.isEmbed &&
      provider === IdentityProvider.Apple
        ? `localredirect.${host}`
        : ctx.isEmbed &&
            (ctx.os === OperatingSystem.IOS || ctx.os === OperatingSystem.MACOS)
          ? `${app.product.toLowerCase()}_schemeredirect.${host}`
          : host;
    const state = guestPartForState + ":" + domainPartForState;
    let url =
      config.authorise_url +
      "?client_id=" +
      config.client_id +
      "&scope=" +
      config.scope +
      "&response_type=" +
      (config.response_type ?? "code") +
      "&state=" +
      state +
      "&prompt=select_account";
    let redirectUri = "";
    if (config.response_mode === "form_post") {
      url += "&response_mode=form_post";
    }
    if (config.isRedirectToClient) {
      const clientRedirect = ctx.isEmbed
        ? (import.meta.env?.VITE_OAUTH_REDIRECT ?? "https://" + host)
        : window.location.origin;
      redirectUri = clientRedirect + "/oauth/" + config.oauth_slug;
    } else {
      redirectUri =
        import.meta.env?.VITE_API_URL + "/oauth/" + config.oauth_slug;
    }
    if (config.code_challenge_method) {
      url +=
        "&code_challenge=challenge&code_challenge_method=" +
        config.code_challenge_method;
    }
    if (!redirectUri) return;
    url += "&redirect_uri=" + redirectUri;
    if (ctx.isEmbed) {
      if (
        provider === IdentityProvider.Apple &&
        ctx.os === OperatingSystem.MACOS
      ) {
        goto(url);
        return;
      }
      if (
        config.isUseAuthClient &&
        (ctx.os === OperatingSystem.MACOS || ctx.os === OperatingSystem.WINDOWS)
      ) {
        const host =
          dev || app.isDebugMode
            ? "http://localhost:5002"
            : `https://${import.meta.env?.VITE_HOST}`;
        url = `${host}/embed?provider=${config.oauth_slug}&guest=${guestPartForState}`;
      }
      navigation.openLink(
        url,
        ctx.os === OperatingSystem.IOS || ctx.os === OperatingSystem.MACOS
      );
    } else {
      goto(url);
    }
  }
};
