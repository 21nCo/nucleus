import { configureShortcutHost } from "@nucleum/stores/keyboard/shortcut-host";
import { configureRecentsHost } from "@nucleum/stores/resources/recent-host";
import { shortcutsConfig } from "@nucleum/application/shortcuts/shortcuts.config";
import { resolveProductConfig } from "@nucleum/products/product.config";
import { configureResourcePanelHost } from "@nucleum/stores/resources/resource-panel-host";
import { get, writable } from "svelte/store";
import { AppSkin } from "@21n/theme/appearance.type";
import { AppSearchParam, type IAppStore } from "@nucleum/stores/appStore.type";
import type { DragAndDrop } from "@nucleum/actions/draganddrop.type";
import { DragStatus } from "@nucleum/actions/dragstatus.enum";
import blankJson from "@nucleum/client/config/blank.json";
import colorSchemes from "@21n/theme/colorschemes.json";
import { Resource } from "@nucleum/datafn/resource.enum";
import { shuffleEmojis } from "@21n/elements/avatarPicker/avatars";
import {
  ActionType,
  type IAction
} from "@nucleum/application/commandBar/action.type";
import { IdentityProvider } from "@nucleum/client/runtime/account/oauth.type";
import { dispatchCustomEvent, goto } from "@21n/utils/browser.utils";
import {
  persistLocally,
  getDapId
} from "@nucleum/persistence/persistence.utils";
import { postDataToParent } from "@nucleum/client/runtime/embed/embed.utils";
import modalEvent, {
  configureOverlayHost
} from "@nucleum/stores/overlays/modal.store";
import view from "@nucleum/stores/view.store";
import context from "@nucleum/stores/context.store";
import {
  appEvents,
  confirmationNotification
} from "@nucleum/stores/notification.store";
import { Embed, OperatingSystem } from "@nucleum/client/runtime/context.type";
import { AccessMode } from "@nucleum/datafn/resource.type";
import { ResourceActionType } from "@nucleum/schema/legacy/resource-action.enum";
import { InteractionMode } from "@21n/elements/keyboard/interaction-mode.type";
import { Action } from "@nucleum/application/commandBar/action.enum";
import {
  GlobalEvent,
  type Event
} from "@nucleum/stores/notifications/event.enum";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { Size } from "@21n/elements/size.enum";
import type { IRecordId } from "@nucleum/schema/legacy/data.type";
import account from "@nucleum/stores/account.store";
import { tabs, vTrail } from "@21n/layout/topNav/tabs/tabs.store";
import {
  determineResourceAccessMode,
  resolveProductResources,
  resourceAction
} from "@nucleum/datafn/resource.utils";
import { Product } from "@nucleum/client/config/product.type";
import { EmbedDataMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
import { datafn, datafnRuntime } from "@nucleum/datafn/datafn.store";
import { generateResourceId } from "@nucleum/datafn/id.utils";
import { configureResourceActionHost } from "@nucleum/stores/resources/resource-action-host";
import { copyResourceLinkToClipboard } from "@nucleum/application/record/resource-link.utils";

// export const app = writable<{ product: string; env: string }>({
//   product: "tidy",
//   env: "dev"
// });
// export const appEvents = initEventStore({ event: AppEvent.NONE, value: false });

export const currentTime = writable<Date>(new Date());
export const appLoadingState = writable<{
  isBaseLoaded: boolean;
  isLocalLoaded: boolean;
}>({ isBaseLoaded: false, isLocalLoaded: false });
export const leftThresholdCrossedStore = writable("");
export const isTouchDevice = writable(false);

export const appStoreShuffleEmojis = writable(shuffleEmojis);
export const intercomId = import.meta.env?.VITE_INTERCOM_ID ?? "t4qp4qlr";
export const selectedTimePeriod = writable<Date>(new Date());

/**
 * Paths that are excluded to redirection checks like login
 */
export const excludedPathsForRedirectionCheck = [
  "expired",
  "signup",
  "login",
  "404",
  "onboarding",
  "error",
  "welcome",
  "play",
  Action.EXTENSTION_LOGIN,
  "oauth"
];

let blankDetails: any = blankJson.find(
  (subatom: any) => subatom.url == "blank.coop"
);
export const blank = writable(blankDetails);

export const dragAndDropStore = createDragAndDropStore();
const dndPageOwners = new Set<symbol>();

/**
 * Keeps global drag and paste handlers suspended while an owning surface is mounted.
 */
export function acquireDnDPage() {
  const owner = Symbol("dnd-page-owner");
  dndPageOwners.add(owner);
  syncDnDPageState();
  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;
    dndPageOwners.delete(owner);
    syncDnDPageState();
  };
}

function syncDnDPageState() {
  appStore.update((state) => ({
    ...state,
    isDnDPageActive: dndPageOwners.size > 0
  }));
}

function createDragAndDropStore() {
  const { subscribe, set, update } = writable<DragAndDrop>({
    dragItem: {},
    dropItem: {},
    dragEnterItem: {},
    dragLeaveItem: {},
    dragStatus: DragStatus.NONE,
    dragId: "",
    dragEnterId: "",
    dropId: "",
    forwardDrop: false
  });

  return {
    subscribe,
    set,
    update,
    reset: () => {
      set({
        dragItem: {},
        dropItem: {},
        dragEnterItem: {},
        dragLeaveItem: {},
        dragStatus: DragStatus.NONE,
        dragId: "",
        dragEnterId: "",
        dropId: "",
        forwardDrop: false
      });
    }
  };
}

//todo - generate cool placeholders for focus using AI
//"three", "four", "wood","DEF5E5", "EEF1FF", "FBF8F1", "F0ECE3"
//["light", "dark", "dracula", "dark-forest", "light-smoothy", "light-grainy"]
//App modes: minimal, journal, future (3026)
//themes: clean, playful, neomorphic, neobrutal, glassmorphic

const tempColorSchemes = [
  "scheme1",
  "scheme2",
  "scheme3",
  "scheme4",
  "scheme5",
  "scheme6",
  "scheme7",
  "scheme8",
  "scheme9",
  "scheme10",
  "scheme11"
];

const isDebugMode =
  import.meta.env?.DEV && import.meta.env?.VITE_ISDEBUG === "true";
const isExperimentalMode =
  import.meta.env?.DEV && import.meta.env?.VITE_ISEXPERIMENTAL === "true";

let themes = [AppSkin.Clean, AppSkin.Glassy];
if (isDebugMode) themes = themes.concat([AppSkin.Vibrant, AppSkin.Futuristic]);
export const appConstants = {
  themes,
  colorSchemes,
  tempColorSchemes
};

const recordSpecificSearchParams = [
  /-type$/,
  /-tab$/,
  /-task$/,
  /-nodeView$/,
  AppSearchParam.EDIT,
  AppSearchParam.VIEW,
  AppSearchParam.POP_AT,
  AppSearchParam.SPLIT_AT,
  AppSearchParam.FSPLIT_AT,
  AppSearchParam.FULL_AT,
  AppSearchParam.LINK,
  AppSearchParam.DATE,
  AppSearchParam.SETTING,
  AccessMode.FSPLIT
];

// export const appStore = initAppStore();
const { subscribe, set, update } = writable<IAppStore>({
  product: Product.NUCLEUM,
  env: "dev",
  isDebugMode,
  isExperimentalMode,
  appData: {},
  currentPath: "",
  isMenuHidden: false,
  actions: [],
  interactionMode: InteractionMode.DEFAULT
});

export const appStore = {
  subscribe,
  set,
  update,
  resolveComponentFromPath: (path: string) => {
    const actions = get(appStore).actions;
    let component = actions.find((x) => x.path === path);
    if (component) return component;
    component = actions.find((x) => x.action === path);
    if (component) return component;
    return null;
  },
  /**
   * Determines whether the app menu should be hidden for a path
   * @param newPath path which needs to checked
   * @param n view
   * @returns a boolean whether app menu should be hidden or not
   */
  checkIfNeedToHideMenu: (newPath: string) => {
    const n = get(view);
    const path = newPath.split("?")[0];
    if (path.split("/")[1]) {
      let component = appStore.resolveComponentFromPath(path.split("/")[1]);
      if (component?.isMenuHidden) return true;
    }
    const listOfPathsToHideMenu = {
      portrait: ["/objective/*", "/goal/*", "/cp/*"],
      landscape: []
    };
    if (!path) return false;
    let pathParts = path.split("/").filter((p) => p);
    if (n.isPortrait) {
      if (listOfPathsToHideMenu.portrait.includes(path)) return true;
      //currently only supports one level deep, but can be extended to support more
      else if (
        pathParts.length > 1 &&
        listOfPathsToHideMenu.portrait.includes(`/${pathParts[0]}/*`)
      )
        return true;
    } else {
      //check for landscape
    }
    return false;
  },
  gotoPath: async (
    path: string,
    props?: {
      queryParams?: any;
      replaceState?: boolean;
    }
  ) => {
    logger.log({ method: "gotoPath", path });
    logger.info({
      at: "appStore.gotoPath",
      path,
      replaceState: props?.replaceState,
      currentPath:
        typeof window !== "undefined" ? window.location.pathname : undefined
    });
    //TODO
    // appStore.hideFullScreenPlayer();
    if (props?.queryParams) {
      const queryString = new URLSearchParams(props.queryParams).toString();
      path += "?" + queryString;
    }
    update((n: IAppStore) => {
      n = {
        ...n,
        currentPath: path,
        isMenuHidden: appStore.checkIfNeedToHideMenu(path)
      };
      return n;
    });
    goto(path, false, props?.replaceState ?? false);
  },
  gotoErrorPage: (err: any) => {
    //TODO - log error, show error code on error page
    logger.log({ at: "gotoErrorPage", err });
    appStore.gotoPath("/error");
  },

  /**
   * @deprecated - use openResource instead
   * @param item
   * @param id
   * @param params
   */
  gotoResource: async (item: Resource, id: string, params: any = null) => {
    const path = `/${item}/${id}`;
    update((n: IAppStore) => {
      n = {
        ...n,
        currentPath: path,
        isMenuHidden: appStore.checkIfNeedToHideMenu(path)
      };
      return n;
    });
    goto(path);
  },
  resolveAction: (slug: string) => {
    const actions = get(appStore).actions;
    let action = actions.find(
      (x) => x.action?.toLowerCase() == slug.toLowerCase()
    );
    const contextData = get(context);
    const accountData = get(account);
    if (action && action.hideContext?.includes(contextData.embed)) return null;
    if (action && action.hideContext?.includes(contextData.os)) return null;
    if (action && action.hideContext?.includes(accountData.dataMode))
      return null;
    if (action) return action;
    return null;
  },
  runAction: (
    slug: string,
    params: {
      componentParams?: any;
      isReturnIfComponent?: boolean;
      searchParams?: Record<string, string | boolean | number>;
    } = {
      componentParams: undefined,
      isReturnIfComponent: false,
      searchParams: undefined
    }
  ) => {
    let action = appStore.resolveAction(slug);
    logger.log({ at: "runAction", action, slug, params });
    if (!action) {
      appStore.gotoPath("404");
      return;
    }
    const store = get(appStore);
    const ctx = get(context);
    const viewData = get(view);
    const isRenderAsPage =
      action.isRenderAsPageInPortrait && viewData.isPortrait;
    if (ctx.embed === Embed.HANDSET) {
      action.type = action.handsetBehaviorType ?? action.type;
    }
    if (action.type === ActionType.LINK) {
      const url = store.appData.urls?.[action.action];
      if (!url) return;
      if (url) return appStore.openLink(url);
    } else if (action.type === ActionType.FUNCTION) {
      if (!action.fn) return;
      return action.fn({
        componentParams: params?.componentParams,
        searchParams: params?.searchParams,
        view: viewData,
        context: ctx
      });
    } else if (action.type === ActionType.SEARCH_CMD) {
      appStore.runAction(Action.CMD, {
        componentParams: {
          command: action.action,
          commandType: action.type,
          componentParams: params?.componentParams
        }
      });
    } else if (action.type === ActionType.EVENT) {
      appEvents.publish(action.action as Event, params?.componentParams);
    } else if (action.type === ActionType.CONFIRMATION && action.confirmation) {
      confirmationNotification.notify(action.confirmation);
    } else if (params.isReturnIfComponent) {
      return action;
    } else if (action.type === ActionType.RESOURCE && !isRenderAsPage) {
      appStore.openResource(
        action.action,
        action.accessMode ?? AccessMode.POP,
        {
          searchParams: params?.searchParams
        }
      );
    } else if (action.type === ActionType.MODAL && !isRenderAsPage) {
      modalEvent.notify({
        path: action.action,
        isShow: true,
        componentParams: {
          ...(action?.componentParams ?? {}),
          ...(params?.componentParams ?? {})
        },
        ...action.modalParams
      });
      if (params?.searchParams) {
        appStore.toggleSearchParam(params.searchParams);
      }
    } else if (action.type === ActionType.LIVE) {
      if (action.liveActionParams?.isOpeningBehaviorConfigurable) {
        //TODO - check for default opening mode preference
      }
      const mode = action.accessMode ?? AccessMode.RIGHT;
      const paramPresent = new URLSearchParams(window.location.search).get(
        mode
      );
      if (paramPresent && paramPresent === slug) {
        appStore.toggleSearchParam([mode]);
      } else {
        appStore.toggleSearchParam({
          ...(mode === AccessMode.MAIN
            ? {
                [AccessMode.POP]: null,
                [AccessMode.FSPLIT]: null
              }
            : {}),
          [mode]: slug
        });
      }
    } else if (action.component) {
      logger.log({
        at: "running action",
        action,
        searchParams: params?.searchParams
      });
      if (
        store.interactionMode === InteractionMode.AGENT &&
        ctx.embed !== Embed.HANDSET
      ) {
        appStore.toggleSearchParam({ tab: "page:" + action.action });
      } else {
        appStore.gotoPath("/" + (action.path ?? action.action), {
          queryParams: params?.searchParams
        });
      }
      return;
    }
  },
  openLink: (url: string, isOauthFlow: boolean = false) => {
    logger.log({ at: "opening link", url });
    const ctx = get(context);
    if (!url) return;
    if (!url.includes("http")) {
      appStore.gotoPath(url);
      return;
    }
    if (ctx.isEmbed) {
      if (isOauthFlow) {
        postDataToParent(EmbedDataMessage.OAUTH, url);
      } else {
        postDataToParent(EmbedDataMessage.LINK, url);
      }
    } else {
      let win = window?.open(url, "_blank", "noopener,noreferrer");
      if (win) {
        win.focus();
      }
    }
  },
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
      //TODO generate code challenge
      url +=
        "&code_challenge=challenge&code_challenge_method=" +
        config.code_challenge_method;
    }
    if (!redirectUri) return;
    url += "&redirect_uri=" + redirectUri;
    // url += "&redirect_uri=" + encodeURIComponent(redirectUri);
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
      appStore.openLink(
        url,
        ctx.os === OperatingSystem.IOS || ctx.os === OperatingSystem.MACOS
      );
    } else {
      goto(url);
    }
  },
  runClientUpdate: () => {
    logger.log("running client update");
    //todo - show user a message that an update is available - auto updating for now
    window?.location?.reload();
  },
  resolveRecordSpecificSearchParamPrefix: (id: IRecordId) => {
    return id.toString().slice(-5);
  },
  resolveRecordSpecificSearchParam: (id: IRecordId, param: string) => {
    const prefix = appStore.resolveRecordSpecificSearchParamPrefix(id);
    return `${prefix}-${param}`;
  },
  toggleSearchParamRecordSpecific: (
    id: IRecordId,
    params:
      Record<string, string | boolean | number | null> | (string | RegExp)[],
    additional?: {
      isPreventRefresh?: boolean;
      url?: URL;
    }
  ) => {
    const prefix = appStore.resolveRecordSpecificSearchParamPrefix(id);
    let modified: Record<string, string | boolean | number | null> | string[] =
      {};
    if (Array.isArray(params)) {
      modified = params.map((p) => `${prefix}-${p}`);
    } else {
      const recordSpecificParams: Record<
        string,
        string | boolean | number | null
      > = {};
      Object.entries(params).forEach(([key, value]) => {
        recordSpecificParams[`${prefix}-${key}`] = value;
      });
      modified = recordSpecificParams;
    }
    return appStore.toggleSearchParam(modified, additional);
  },
  /**
   * Sets or deletes search params
   * @param params Send an object to set params, array of strings to delete
   * @returns
   */
  toggleSearchParam: (
    params:
      Record<string, string | boolean | number | null> | (string | RegExp)[],
    additional?: {
      isPreventRefresh?: boolean;
      url?: URL;
      replaceState?: boolean;
    }
  ) => {
    if (!params) return;
    logger.log({ at: "toggleSearchParam", params, additional });
    const url = additional?.url ?? new URL(window.location.href);
    if (Array.isArray(params)) {
      params.forEach((p) => {
        if (typeof p === "string" && !url.searchParams.get(p)) return;
        if (typeof p === "string") url.searchParams.delete(p);
        else if (p instanceof RegExp) {
          url.searchParams.forEach((value, key) => {
            if (p.test(key)) url.searchParams.delete(key);
          });
        }
      });
      if (!additional?.isPreventRefresh) {
        appStore.gotoPath(url.href, {
          replaceState: additional?.replaceState ?? true
        });
      }
      return url;
    }
    if (typeof params !== "object") return;
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) url.searchParams.delete(key);
      else url.searchParams.set(key, value.toString());
    });
    if (!additional?.isPreventRefresh) {
      appStore.gotoPath(url.href, {
        replaceState: additional?.replaceState ?? true
      });
    }
    return url;
  },
  /**
   * Determines if the current view is a full view or a pop view
   * @returns
   */
  isOverlay: (recordId?: IRecordId) => {
    if (recordId) {
      const accessMode = determineResourceAccessMode(recordId);
      return accessMode === AccessMode.POP || accessMode === AccessMode.FULL;
    }
    return (
      new URLSearchParams(window.location.search).get(AccessMode.FULL) ||
      new URLSearchParams(window.location.search).get(AccessMode.POP)
    );
  },
  determineCurrentResourceAccessMode1: (id: string) => {
    if (new URLSearchParams(window.location.search).get(AccessMode.POP) === id)
      return AccessMode.POP;
    else if (
      new URLSearchParams(window.location.search).get(AccessMode.FULL) === id
    )
      return AccessMode.FULL;
    else if (
      new URLSearchParams(window.location.search).get(AccessMode.SPLIT) === id
    )
      return AccessMode.SPLIT;
    else if (
      new URLSearchParams(window.location.search).get(AccessMode.FSPLIT) === id
    )
      return AccessMode.FSPLIT;
    else return AccessMode.INLINE;
  },
  /**
   *
   * TODO - shortcuts from user settings
   *
   * @param event
   * @returns
   */
  determineClickAccessMode: (event: MouseEvent) => {
    if (event.altKey && event.metaKey) {
      return AccessMode.TAB;
    } else if (event.shiftKey) return AccessMode.FULL;
    else if (event.altKey) {
      return AccessMode.SPLIT;
    } else if (event.metaKey) {
      return AccessMode.OPEN_IN_BACKGROUND;
    }
  },
  openResource: (
    id: IRecordId,
    accessMode: AccessMode = AccessMode.INLINE,
    params?: {
      origin?: Action | IRecordId;
      replaceId?: IRecordId;
      searchParams?: Record<string, string | boolean | number | null>;
    }
  ) => {
    logger.log({ at: "openResource", id, accessMode, params });
    if (!id) return;
    let url = new URL(window.location.href);
    if (accessMode === AccessMode.FULL) {
      url =
        appStore.toggleSearchParam([AccessMode.POP, AccessMode.FSPLIT], {
          isPreventRefresh: true
        }) ?? url;
    }
    const timestamp = new Date();
    const runtime = get(datafnRuntime);
    if (runtime?.remoteUrl)
      void datafn.accessLog
        .mutate({
          operation: "insert",
          record: {
            id: generateResourceId(Resource.accessLog),
            resource: id.toString()?.split(":")[0],
            action: ResourceActionType.OPEN,
            resourceId: id,
            timestamp
          }
        })
        .catch((error) =>
          logger.error({ at: "openResource.accessLog", error })
        );
    if (accessMode === AccessMode.TAB) {
      if (params?.replaceId) tabs.replace(id, params.replaceId);
      else tabs.open(id);
      return;
    } else if (accessMode === AccessMode.OPEN_IN_BACKGROUND && params?.origin) {
      vTrail.add(params.origin, id, {
        isPreventActivation: true
      });
      appStore.toggleSearchParam(
        { [AccessMode.RIGHT]: Action.NAVIGATOR },
        { url }
      );
      return;
    } else if (accessMode === AccessMode.SPLIT) {
      const isFullOrPop = appStore.isOverlay(params?.replaceId);
      if (isFullOrPop) accessMode = AccessMode.FSPLIT;
      else accessMode = AccessMode.SPLIT;
    }
    logger.log({ at: "openResource", accessMode });
    let isOpenNavigator = false;
    let isCloseNavigator = false;
    if (accessMode === AccessMode.POP && params?.origin) {
      isOpenNavigator = vTrail.add(params.origin, id);
    } else if (accessMode === AccessMode.POP) {
      vTrail.clear();
      isCloseNavigator =
        new URL(window.location.href).searchParams.get(AccessMode.RIGHT) ===
        Action.NAVIGATOR;
    }
    url =
      appStore.toggleSearchParam(recordSpecificSearchParams, {
        isPreventRefresh: true,
        url
      }) ?? url;
    appStore.toggleSearchParam(
      {
        [accessMode]: id.toString(),
        [accessMode + "At"]: timestamp.getTime(),
        ...(params?.searchParams ?? {}),
        ...(isOpenNavigator ? { [AccessMode.RIGHT]: Action.NAVIGATOR } : {}),
        ...(isCloseNavigator ? { [AccessMode.RIGHT]: null } : {})
      },
      {
        url: url
      }
    );
  },
  /**
   * Clears all tooltips from the DOM. This is to avoid an issue where clicking on a mention in markdown when the tooltip is activated is not removing the tooltip properly on navigation to that mention node page.
   */
  clearAllTooltips: () => {
    const tooltipsContainer = document.getElementById("tooltips");
    if (tooltipsContainer) {
      tooltipsContainer.innerHTML = "";
    }
  },
  resourceClickHandlerForGraph: (
    id: IRecordId,
    event: MouseEvent,
    params?: {
      replaceId?: IRecordId;
    }
  ) => {
    const clickAccessMode = appStore.determineClickAccessMode(event);
    let accessMode = AccessMode.SPLIT;
    if (clickAccessMode === AccessMode.SPLIT) {
      accessMode = AccessMode.POP;
    } else if (clickAccessMode) {
      accessMode = clickAccessMode;
    }
    appStore.openResource(id, accessMode, {
      replaceId: params?.replaceId
    });
  },
  goBack: (resource?: IRecordId) => {
    appEvents.nav(resource?.toString() ?? "");
    const existingParams = new URLSearchParams(window.location.search);
    const backQueryParam = existingParams.get("back");
    const returnToQueryParam = existingParams.get("returnTo");
    if (backQueryParam) {
      appStore.gotoPath(backQueryParam, {
        queryParams: returnToQueryParam
          ? {
              returnTo: returnToQueryParam
            }
          : {}
      });
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    }
  },
  goForward: () => {
    if (window.history.length > 1) {
      window.history.forward();
    }
  },
  /**
   * Handles resource click.
   *
   * Sending replaceId will use current access mode of the replaceId resource as defaultTo.
   *
   * @param event - mouse event
   * @param id - resource id to be opened
   * @param defaultTo - default access mode
   * @param params - additional params
   * @returns
   */
  resourceClickHandler: (
    event: MouseEvent | undefined,
    id: IRecordId,
    params?: {
      origin?: Action | IRecordId;
      defaultTo?: AccessMode;
      replaceId?: IRecordId;
      searchParams?: Record<string, string | boolean | number | null>;
    }
  ) => {
    if (!id) return;
    appStore.toggleSearchParam([AppSearchParam.VIEW]);
    let accessMode;
    const defaultTo =
      params?.defaultTo ??
      (params?.replaceId
        ? determineResourceAccessMode(params.replaceId)
        : AccessMode.POP);
    if (event) accessMode = appStore.determineClickAccessMode(event);
    if (!accessMode) accessMode = defaultTo;
    logger.log({ at: "resourceClickHandler", accessMode, defaultTo });
    appStore.openResource(id, accessMode, {
      replaceId: params?.replaceId,
      searchParams: params?.searchParams,
      origin: params?.origin
    });
    logger.log({
      at: "resourceClickHandler",
      id,
      defaultTo,
      accessMode,
      event
    });
  },
  closeResource: (props?: {
    id?: IRecordId;
    accessMode?: AccessMode;
    isRestrictToModals?: boolean;
  }) => {
    const restoreInlineResourceIfPrev = () => {
      const prevMode = url.searchParams.get("prev");
      if (prevMode === AccessMode.INLINE && props?.id)
        url.searchParams.set(prevMode, props?.id.toString());
    };
    appEvents.nav(props?.id?.toString() ?? "");
    const url =
      appStore.toggleSearchParam(recordSpecificSearchParams, {
        isPreventRefresh: true
      }) ?? new URL(window.location.href);
    if (props?.accessMode) {
      appStore.toggleSearchParam([props.accessMode], { url });
      restoreInlineResourceIfPrev();
      return;
    } else if (props?.id) {
      const accessMode = determineResourceAccessMode(props.id);
      if (accessMode) {
        appStore.toggleSearchParam([accessMode], { url });
        restoreInlineResourceIfPrev();
      }
      return;
    }
    if (props?.isRestrictToModals) {
      appStore.toggleSearchParam([AccessMode.FSPLIT, AccessMode.POP], {
        url
      });
      return;
    }
    restoreInlineResourceIfPrev();
    removeSearchParam("prev");
    removeSearchParam(AccessMode.SPLIT);
    removeSearchParam(AccessMode.FULL);
    removeSearchParam(AccessMode.POP);
    removeSearchParam(AccessMode.FSPLIT);
    removeSearchParam(AccessMode.MAIN);
    appStore.gotoPath(url.href);

    function removeSearchParam(param: string) {
      if (!url.searchParams.get(param)) return;
      url.searchParams.delete(param);
    }
  },
  toggleFullScreen: (currentMode: AccessMode, resourceId: IRecordId) => {
    logger.log({ at: "toggleFullAccessMode", currentMode, resourceId });
    const hasMaxParam = new URLSearchParams(window.location.search).get(
      AppSearchParam.MAX
    );
    if (hasMaxParam) {
      appStore.toggleSearchParam({ [AppSearchParam.MAX]: null });
    } else {
      appStore.toggleSearchParam({ [AppSearchParam.MAX]: true });
    }
    return;
    appStore.toggleSearchParam({ [AccessMode.FULL]: null });
    const url =
      appStore.toggleSearchParam(recordSpecificSearchParams, {
        isPreventRefresh: true
      }) ?? new URL(window.location.href);
    removeSearchParam(currentMode);
    if (currentMode === AccessMode.FULL) {
      const prevMode = url.searchParams.get("prev");
      logger.log({ at: "toggleFocusAccessMode", currentMode, prevMode });
      if (prevMode) {
        url.searchParams.set(prevMode as string, resourceId.toString());
        removeSearchParam("prev");
      }
    } else {
      url.searchParams.set(AccessMode.FULL, resourceId.toString());
      url.searchParams.set("prev", currentMode);
    }
    appStore.gotoPath(url.href);

    function removeSearchParam(param: string) {
      if (!url.searchParams.get(param)) return;
      url.searchParams.delete(param);
    }
  },
  initializeProductInformation: (details: { product: string; env: string }) => {
    update((n: IAppStore) => {
      n.product = details.product as Product;
      n.env = details.env;
      return n;
    });
  },
  setVersion: (version: string, build: number) => {
    update((n: IAppStore) => {
      n.version = version;
      n.build = build;
      return n;
    });
  },
  loadAppData: (data: any, params?: { isDefaultData: boolean }) => {
    update((n: IAppStore) => {
      const env = n.env;
      if (data.env && data.env[env]) {
        n.appData = { ...data, ...data.env[env] };
      } else {
        n.appData = data;
      }
      if (!params?.isDefaultData) {
        persistLocally(Resource.appData, data);
      }
      return n;
    });
  },
  turnDebugMode: (isDebugMode: boolean) => {
    update((n: IAppStore) => {
      n.isDebugMode = isDebugMode;
      return n;
    });
  },
  toggleMenuVisibility: (isHidden?: boolean) => {
    update((n: IAppStore) => {
      if (isHidden !== undefined && isHidden !== null) {
        n = { ...n, isMenuHidden: isHidden };
      } else {
        n = { ...n, isMenuHidden: !n.isMenuHidden };
      }
      return n;
    });
  },
  toggleTopBar: (isMinimal: boolean) => {
    update((n: IAppStore) => {
      n = { ...n, isMinimalTopBar: isMinimal };
      return n;
    });
  },
  setCurrentPath: (path: string) => {
    update((n: IAppStore) => {
      n = {
        ...n,
        currentPath: path,
        isMenuHidden: appStore.checkIfNeedToHideMenu(path)
      };
      return n;
    });
  },
  initActions: (actions: IAction[], settings: IAction[]) => {
    update((n: IAppStore) => {
      if (!n.actions) n.actions = [];
      n.actions = [...actions, ...settings];
      return n;
    });
  },
  initActionsForSheet: (actions: IAction[]) => {
    update((n: IAppStore) => {
      n.actions = [...actions];
      return n;
    });
  },

  runResourceAction: (
    resource: Resource,
    action: ResourceActionType,
    params?: any
  ) => {
    return appStore.runAction(resourceAction(resource, action), params);
  },

  addToRecents: (data: { record: any; type: Resource; timestamp: Date }) => {
    dispatchCustomEvent(GlobalEvent.ADD_TO_RECENTS, data);
  }
};

configureOverlayHost({
  onDismiss: (action) => appEvents.nav(action),
  openFullscreen: (path) =>
    appStore.toggleSearchParam({
      [AccessMode.FULL]: path,
      [AccessMode.POP]: null
    }),
  closeFullscreen: () => appStore.toggleSearchParam([AccessMode.FULL]),
  resolvePlayer: (path) =>
    appStore.resolveComponentFromPath(path)?.associatedPlayer
});

configureShortcutHost({
  defaults: shortcutsConfig,
  configurableActions: () => resolveProductConfig().configurableShortcuts
});

configureRecentsHost({
  resources: () => resolveProductResources(get(appStore).product)
});

configureResourcePanelHost({
  readPanel: (id, url) => {
    return url.searchParams.get(
      appStore.resolveRecordSpecificSearchParam(id, AppSearchParam.PANEL)
    );
  },
  writePanel: (id, panel) =>
    appStore.toggleSearchParamRecordSpecific(id, {
      [AppSearchParam.PANEL]: panel
    }),
  close: (id) => appStore.closeResource({ id }),
  goBack: () => appStore.goBack(),
  maximize: (mode, id) => appStore.toggleFullScreen(mode, id)
});

configureResourceActionHost({
  copyLink: copyResourceLinkToClipboard,
  open: (id, mode, options) => appStore.openResource(id, mode, options),
  close: (options) => appStore.closeResource(options),
  maximize: (mode, id) => appStore.toggleFullScreen(mode, id),
  openTab: (id) => tabs.open(id),
  removeTab: (id) => tabs.remove(id),
  requestLink: (options) =>
    appStore.runAction(Action.BULK_LINK, { componentParams: options }),
  afterNodeMutation: async (action, ids) => {
    const lifecycle = await import("@nucleum/features/memory/node/node.store");
    if (action === "archive") return lifecycle.onNodeArchive(ids);
    if (action === "unarchive") return lifecycle.onNodeUnarchive(ids);
    return lifecycle.onNodeTrash(ids);
  }
});

export const isInEditMode = initEditModeStore();

function initEditModeStore() {
  const { subscribe, set, update } = writable<boolean>(false);
  return {
    subscribe,
    set,
    toggle: (val?: boolean) => {
      update((n: boolean) => {
        if (val !== undefined) return val;
        return !n;
      });
    }
  };
}
