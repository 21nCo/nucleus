import { configureProductResourceTables } from "@nucleum/client/config/product-resources";
import { configureActionRenderer } from "@nucleum/stores/resources/action-renderer";
import ComponentResolver from "@21n/layout/paint/ComponentResolver.svelte";
import { get } from "svelte/store";
import { appStore } from "@nucleum/stores/app.store";
import { AppSearchParam } from "@nucleum/stores/appStore.type";
import { appEvents } from "@nucleum/stores/notification.store";
import { tabs } from "@21n/layout/topNav/tabs/tabs.store";
import { AccessMode } from "@nucleum/datafn/resource.type";
import { resolveProductResources } from "@nucleum/datafn/resource.utils";
import { Action } from "@nucleum/client/config/action.enum";
import { configureOverlayHost } from "@nucleum/stores/overlays/modal.store";
import { configureRecordRenderer } from "@nucleum/stores/resources/record-renderer";
import { configureShortcutHost } from "@nucleum/stores/keyboard/shortcut-host";
import { configureRecentsHost } from "@nucleum/stores/resources/recent-host";
import { configureResourcePanelHost } from "@nucleum/stores/resources/resource-panel-host";
import { configureResourceActionHost } from "@nucleum/stores/resources/resource-action-host";
import { resolveProductConfig } from "@nucleum/products/product.config";
import { shortcutsConfig } from "../shortcuts/shortcuts.config";
import { copyResourceLinkToClipboard } from "../record/resource-link.utils";
import Records from "../record/Records.svelte";

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

configureRecordRenderer(Records);

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


configureActionRenderer(ComponentResolver);
configureProductResourceTables((product) => resolveProductConfig(product).resources.table);
