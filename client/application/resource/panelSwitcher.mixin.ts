import { appStore } from "@nucleum/stores/app.store";
import { AppSearchParam } from "@nucleum/stores/appStore.type";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
import { dispatchCustomEvent } from "@21n/utils/browser.utils";
import { ResourcePanelType } from "@nucleum/application/resource/resource-panel.type";

export const PanelSwitcherMixin = {
  switchPanel(
    this: {
      get: () => {
        id: string;
        panel?: string;
        defaultPanel?: string;
      };
      update: (updater: (value: any) => any) => void;
    },
    panelValue?: string
  ) {
    const state = this.get();
    let panel: string | undefined = state?.panel;
    let isInFocusMode: boolean = false;
    if (panelValue === "focus") {
      panel = ResourcePanelType.NONE;
      isInFocusMode = true;
    } else if (panelValue === panel) {
      panel = state.defaultPanel ?? ResourcePanelType.DEFAULT;
    } else {
      panel = panelValue ?? state.defaultPanel;
    }

    if (panel) {
      appStore.toggleSearchParamRecordSpecific(state.id, {
        [AppSearchParam.PANEL]: panel
      });
    }

    this.update((x: any) => ({
      ...x,
      panel,
      isInFocusMode
    }));

    if (
      !panel ||
      panel === ResourcePanelType.NONE ||
      panel === ResourcePanelType.DEFAULT
    ) {
      dispatchCustomEvent(GlobalEvent.EXPAND_PANEL, {});
    } else {
      dispatchCustomEvent(GlobalEvent.COLLAPSE_PANEL, {});
    }
  }
};
