import { ActionType, type IAction } from "@nucleum/client/config/action.type";
import AccountSettings from "@nucleum/application/settings/account/AccountSettings.svelte";
import SettingsAsPage from "@nucleum/application/settings/asPage/SettingsAsPage.svelte";
import ShortcutSettings from "@nucleum/application/shortcuts/settings/ShortcutSettings.svelte";
import AboutSettings from "@nucleum/application/settings/about/AboutSettings.svelte";
import ShareToFriends from "@nucleum/application/settings/ShareToFriends.svelte";
import DateTimeSettings from "@nucleum/application/settings/datetime/DateTimeSettings.svelte";
import AppMenuSettings from "@nucleum/application/settings/AppMenuSettings.svelte";
import AccessibilitySettings from "@nucleum/application/settings/appearance/accessibility/AccessibilitySettings.svelte";
import AppearanceSettings from "@nucleum/application/settings/appearance/AppearanceSettings.svelte";
import SettingsAsModal from "@nucleum/application/settings/SettingsAsModal.svelte";
import { Size } from "@21n/elements/size.enum";
import { Orientation } from "@21n/elements/direction.enum";
import { Action } from "@nucleum/client/config/action.enum";
import InteractionModeSettings from "@nucleum/application/settings/interactionMode/InteractionModeSettings.svelte";
import { Embed, OperatingSystem } from "@nucleum/client/runtime/context.type";
import SyncSettings from "@nucleum/application/settings/sync/SyncSettings.svelte";
import TacoSettings from "@nucleum/application/settings/taco/TacoSettings.svelte";
import { UserDataMode } from "@nucleum/client/runtime/account/account.type";
import AnalyticsSettings from "@nucleum/products/pointron/settings/AnalyticsSettings.svelte";
import { PointronAction } from "@nucleum/client/config/focus-action.enum";
import SessionSettings from "@nucleum/products/pointron/settings/SessionSettings.svelte";
import ModSettings from "@nucleum/application/settings/mod/ModSettings.svelte";
import DeveloperSettings from "@nucleum/application/settings/developer/DeveloperSettings.svelte";

const settings: (Required<Pick<IAction, "action">> & Partial<IAction>)[] = [
  {
    action: Action.ACCOUNT,
    label: "Account Settings",
    component: AccountSettings
  },
  {
    action: Action.PYOD,
    label: "Plug Your Own Database",
    icon: "database",
    component: ModSettings
  },
  {
    action: Action.DEVELOPER,
    label: "Developer",
    icon: "code",
    component: DeveloperSettings
  },
  {
    action: Action.ARTIFICIAL_INTELLIGENCE,
    cmdLabel: [{ variant: "aiSettings", label: "AI Settings" }],
    label: "Artificial Intelligence",
    icon: "cpu",
    component: TacoSettings,
    modalParams: {
      title: "Artificial Intelligence",
      layout: {
        size: Size.lg
      }
    }
  },
  {
    action: Action.MODE_OF_INTERACTION,
    label: "Mode of interaction",
    icon: "cursor-click",
    component: InteractionModeSettings,
    modalParams: {
      title: "Mode of interaction",
      layout: {
        size: Size.lg
      }
    },
    hideContext: [Embed.HANDSET]
  },
  {
    action: Action.APPEARANCE_SETTINGS,
    label: "Appearance",
    cmdLabel: [
      { variant: "appearanceSettings", label: "Appearance Settings" },
      { variant: "switchTheme", label: "Switch Theme" },
      { variant: "toggleDarkMode", label: "Toggle Dark Mode" },
      { variant: "toggleLightMode", label: "Toggle Light Mode" }
    ],
    icon: "palette",
    component: AppearanceSettings,
    modalParams: {
      title: "Appearance Settings",
      layout: {
        size: Size.lg
      }
    }
  },
  {
    action: PointronAction.SESSION_SETTINGS_MODAL,
    get cmdLabel() {
      return this.modalParams?.title;
    },
    label: "Focus",
    path: "cp/session",
    icon: "circle",
    type: ActionType.MODAL,
    component: SessionSettings,
    modalParams: {
      title: "Focus Settings",
      layout: {
        size: Size.lg,
        primaryAction: {
          label: "Done"
        }
      }
    }
  },
  {
    action: "analytics-settings",
    get cmdLabel() {
      return this.modalParams?.title;
    },
    label: "Analytics",
    path: "cp/analytic-settings",
    icon: "chart-line-up",
    type: ActionType.MODAL,
    component: AnalyticsSettings,
    modalParams: {
      title: "Analytics Settings"
    }
  },
  {
    action: "appMenu",
    label: "App Menu",
    icon: "list",
    isInactive: true,
    component: AppMenuSettings
  },
  {
    action: Action.SHORTCUTS,
    label: "Keyboard shortcuts",
    icon: "keyboard",
    component: ShortcutSettings,
    hideContext: [Embed.HANDSET]
  },
  {
    action: Action.DATETIME_SETTINGS,
    cmdLabel: "Date & Time Settings",
    label: "Date & Time",
    icon: "calendar-blank",
    component: DateTimeSettings
  },
  {
    action: Action.ACCESSIBILITY,
    get cmdLabel() {
      return this.modalParams?.title;
    },
    label: "Accessibility",
    icon: "person-simple",
    component: AccessibilitySettings,
    modalParams: {
      title: "Accessibility Settings"
    }
  },
  {
    action: "share",
    label: "Refer a friend",
    icon: "share",
    component: ShareToFriends
  },
  {
    action: "about",
    label: "About us",
    icon: "info",
    component: AboutSettings
  },
  {
    action: "sync",
    label: "Sync",
    icon: "sync",
    component: SyncSettings,
    modalParams: {
      title: "Sync Settings"
    },
    hideContext: [UserDataMode.LOCAL]
  }
];

/**
 * @deprecated - directly rendering as Modal vs as Page in SettingsAsPage.svelte
 * @returns
 */
export function getSettingsAsPages(): IAction[] {
  return settings
    .map((setting) => {
      const settingCopy = { ...setting };
      delete settingCopy.modalParams;
      return {
        ...settingCopy,
        type: ActionType.PAGE
      };
    })
    .concat({
      action: Action.SETTINGS,
      type: ActionType.PAGE,
      label: "Settings",
      icon: "gear",
      component: SettingsAsPage
    });
}

export function getSettingsAsModal(): IAction[] {
  return settings
    .map((setting) => {
      const settingCopy = { ...setting };
      delete settingCopy.path;
      return {
        ...settingCopy,
        type: ActionType.MODAL
      };
    })
    .concat({
      action: Action.SETTINGS,
      type: ActionType.MODAL,
      label: "Settings",
      icon: "gear",
      isRenderAsPageInPortrait: true,
      component: SettingsAsPage,
      modalParams: {
        layout: {
          size: Size.xl,
          orientation: Orientation.Horizontal,
          ignoreSafeArea: true,
          isShowCantileverClose: true
        }
      }
    });
}
