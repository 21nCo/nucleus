<script lang="ts">
  import "@nucleum/application/composition/resource-hosts";
  import { onDestroy, onMount as onComponentMount, type Snippet } from "svelte";
  import { resolveToken } from "@21n/utils/account.utils";
  import account from "@nucleum/stores/account.store";
  import ExtensionThemeBase from "@nucleum/extensions/ExtensionThemeBase.svelte";
  import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
  import { logger } from "@nucleum/client/runtime/logging/logger";
  import { clientStorage } from "@nucleum/persistence/persistence.utils";
  import { extractProduct } from "@21n/shared-utils/utils";
  import {
    cleanExtensionSprites,
    extensionSprites
  } from "@21n/icons-v2/icon.store";
  //!Below working with dev but not build or package
  // import sprite from "data-text:/assets/icons/sprite.svg";
  // import spritePhBase from "data-text:/assets/icons/sprite-ph-base.svg";
  // import spritePhFill from "data-text:/assets/icons/sprite-ph-fill.svg";
  // import spritePhLight from "data-text:/assets/icons/sprite-ph-light.svg";
  import { resolveIconSvgSheetText } from "@nucleum/extensions/iconSvgSheetTextResolver";
  import { appStore } from "@nucleum/stores/app.store";
  import {
    isRecordId,
    removeDuplicatesFilter
  } from "@nucleum/datafn/resource.utils";
  import { parse } from "@21n/shared-utils/json.utils";
  import { ExtensionStore } from "@nucleum/extensions/extension.store";
  import { Extension } from "@nucleum/client/config/product.type";
  let {
    id,
    extention,
    isLoggedIn = $bindable(false),
    product,
    onLogin = undefined,
    onMount = undefined,
    children = undefined
  }: {
    id: string;
    extention: Extension;
    isLoggedIn?: boolean;
    product: { product: string; env: string };
    onLogin?: ((event: CustomEvent<{ code: number }>) => void) | undefined;
    onMount?: ((event: CustomEvent<void>) => void) | undefined;
    children?: Snippet | undefined;
  } = $props();
  const currentPage = extractProduct(window.location.hostname);
  const isSelfPage =
    currentPage.product === "memotron" ||
    (typeof process !== "undefined"
      ? process.env?.NODE_ENV === "development"
      : false);

  const sprites = [
    "sprite",
    "sprite-ph-base",
    "sprite-ph-light",
    "sprite-ph-fill"
  ];

  sprites.forEach((key) => {
    const content = resolveIconSvgSheetText(key);
    if (!content) return;
    const blob = new Blob([content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    extensionSprites.set(key, url);
  });

  let windowMessageHandler: (event: MessageEvent) => void;
  onComponentMount(async () => {
    onMount?.(new CustomEvent("mount"));
    appStore.initializeProductInformation(product);
    addEventListeners();
    windowMessageHandler = async function (event: MessageEvent) {
      if (event.source != window || !isSelfPage) return;
      if (event.data.type && event.data.type == "signin") {
        await clientStorage.set(
          ClientStorageKey.AUTHFN_TOKEN,
          event.data.token.token
        );
        await clientStorage.remove(ClientStorageKey.STOKEN);
        await clientStorage.set(
          ClientStorageKey.USER_INFO,
          event.data.token.userInfo
        );
        onLogin?.(
          new CustomEvent("login", {
            detail: {
              code: 1
            }
          })
        );
        await bootup();
      }
    };
    window.addEventListener("message", windowMessageHandler, false);
    await refreshUserSession();
  });

  onDestroy(() => {
    cleanExtensionSprites();
    removeEventListeners();
    if (windowMessageHandler) {
      window.removeEventListener("message", windowMessageHandler, false);
    }
  });

  function addEventListeners() {
    window.addEventListener("addToRecents", handleAddToRecents);
  }

  function removeEventListeners() {
    window.removeEventListener("addToRecents", handleAddToRecents);
  }

  async function refreshUserSession() {
    const token = await resolveToken();
    let isSessionExpired = false;
    if (token) isSessionExpired = await checkIfSessionExpired(token);
    if (!token || isSessionExpired) {
      onLogin?.(
        new CustomEvent("login", {
          detail: {
            code: -1
          }
        })
      );
      return;
    }
    await bootup();
    return true;
  }

  async function checkIfSessionExpired(token: string) {
    logger.log({ at: "checkIfSessionExpired" });
    const isExpired = await account.checkIfSessionExpired();
    if (isExpired) {
      await clientStorage.remove(ClientStorageKey.AUTHFN_TOKEN);
      return true;
    }
    return false;
  }

  export async function onTabUpdate() {
    const token = await resolveToken();
    if (token) {
      await ExtensionStore.getInstance()?.pullLatest();
    }
    return token;
  }

  async function bootup() {
    try {
      await account.init();
      isLoggedIn = true;
      logger.log({
        at: "ExtensionBaseLayer.svelte bootup",
        account: $account
      });
      const ext = ExtensionStore.getInstance(extention);
      await ext?.bootup(extention);
    } catch (e) {
      logger.error({
        at: "ExtensionBaseLayer.bootup",
        error: e
      });
    }
  }

  async function handleAddToRecents(event: any) {
    try {
      const { record } = event.detail;
      if (!record || !record.id) return;
      const currentRecents = await clientStorage.get(ClientStorageKey.RECENTS);
      const newRecents = [
        { ...record, id: record.id.toString() },
        ...(currentRecents ? parse(currentRecents) : [])
      ]
        .filter(removeDuplicatesFilter)
        .filter((x: any) => isRecordId(x.id));
      await clientStorage.set(
        ClientStorageKey.RECENTS,
        newRecents.slice(0, 10)
      );
    } catch (e) {
      logger.error({
        at: "ExtensionBaseLayer.handleAddToRecents",
        error: e
      });
    }
  }

  function onFocus() {
    onTabUpdate();
  }
</script>

<ExtensionThemeBase {id}>
  {@render children?.()}
</ExtensionThemeBase>
<svelte:window onfocus={onFocus} />
