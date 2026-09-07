import { get, writable } from "svelte/store";
import {
  AlertType,
  type ConfirmationNotification,
  type ScheduledNotification,
  type Toast,
  type InlineToast
} from "@nucleum/stores/notifications/notification.type";
import { postMessageToParent } from "@nucleum/client/runtime/embed/embed.utils";
import { EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
import { GlobalEvent } from "@nucleum/stores/notifications/event.enum";
import type { IEvent } from "@21n/elements/input/event.type";
import type { Event } from "@nucleum/stores/notifications/event.enum";
import { ObservableStore } from "@nucleum/stores/client.store";
import { logger } from "@nucleum/client/runtime/logging/logger";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { ErrorMessage } from "@nucleum/stores/notifications/error.enum";
import { dispatchCustomEvent } from "@21n/utils/browser.utils";

export const toastDefaultDuration = 3500;
class AppEventStore extends ObservableStore<IEvent> {
  constructor() {
    super("appEvents");
    this.reset();
  }
  reset() {
    this.set({ event: GlobalEvent.NONE, value: false });
  }
  publish(m: Event, value: any = undefined) {
    this.update((n: IEvent) => {
      return { event: m, value };
    });
    this.reset();
    if (typeof window !== "undefined") {
      dispatchCustomEvent(GlobalEvent.EVENT, {
        event: m,
        value
      });
    }
  }

  nav(path: string) {
    this.publish(GlobalEvent.NAV, { path });
  }
}

export const appEvents = new AppEventStore();

export const scheduledNotifications = initScheduledNotificationStore();

function initScheduledNotificationStore() {
  const { subscribe, set, update } = writable<ScheduledNotification[]>([]);
  return {
    subscribe,
    set: (m: ScheduledNotification[]) => {
      set(m);
    },
    reset: () => {
      update(() => {
        return [];
      });
      postMessageToParent(EmbedMessage.CLEAR_NOTIFICATIONS);
    },
    notify: (event: ScheduledNotification[]) => {
      update((n: ScheduledNotification[]) => {
        return event;
      });
    },
    push: (event: ScheduledNotification) => {
      update((n: ScheduledNotification[]) => {
        n.push(event);
        return n;
      });
    }
  };
}

export const toasts = initToastStore();

function initToastStore() {
  let timer: any;
  const { subscribe, set, update } = writable<Toast[]>([]);

  /**
   * Triggers a toast notification
   * @param event Toast event with message and type
   */
  const trigger = (event: Toast) => {
    logger.log({ at: "toast", event });
    let isAlreadyPresent = false;
    update((n: Toast[]) => {
      isAlreadyPresent = n.some((x) => x.id === event.id);
      if (isAlreadyPresent) return n;
      if (n.length > 3) n.shift();
      n.push(event);
      return n;
    });
    if (isAlreadyPresent || event.type === AlertType.PROGRESS) return;
    // if (get(view).isPortrait) {
    //   appStore.runAction(Action.MOBILE_TOAST, {
    //     componentParams: { id: event.id }
    //   });
    // } else {
    timer = setTimeout(() => {
      update((n: Toast[]) => {
        n.shift();
        return n;
      });
    }, toastDefaultDuration);
    // }
  };
  const setProgress = (progress: number) => {
    update((n: Toast[]) => {
      const toast = n.find((x) => x.type === AlertType.PROGRESS);
      if (toast) {
        toast.progress = progress;
      }
      return n;
    });
  };

  const closeProgress = (id: string) => {
    update((n: Toast[]) => {
      return n.filter((x) => x.id !== id);
    });
  };

  return {
    subscribe,
    set: (m: Toast[]) => {
      set(m);
    },
    reset: () => {
      clearTimeout(timer);
      update(() => {
        return [];
      });
    },
    success: (
      message: string,
      params?: {
        title?: string;
        closeProgressId?: string;
      }
    ) => {
      if (params?.closeProgressId) {
        closeProgress(params.closeProgressId);
      }
      const id = generateSimpleRandomId();
      trigger({
        title: params?.title,
        message,
        type: AlertType.SUCCESS,
        id
      });
      return id;
    },
    error: (
      message?: string | ErrorMessage,
      params?: {
        title?: string;
        closeProgressId?: string;
      }
    ) => {
      if (params?.closeProgressId) {
        closeProgress(params.closeProgressId);
      }
      if (!message) {
        message = ErrorMessage.DEFAULT;
      }
      const id = generateSimpleRandomId();
      trigger({ title: params?.title, message, type: AlertType.ERROR, id });
      return id;
    },
    showProgress: (id: string, message: string) => {
      trigger({ message, type: AlertType.PROGRESS, id });
      return id;
    },
    closeProgress,
    setProgress,
    trigger: trigger
  };
}

export const confirmationNotification = initConfirmationStore();

function initConfirmationStore() {
  const { subscribe, set, update } = writable<
    ConfirmationNotification | undefined
  >(undefined);
  return {
    subscribe,
    set: (m: any) => {
      set(m);
    },
    reset: () => {
      setTimeout(() => {
        update(() => {
          return undefined;
        });
      }, 100);
      appEvents.nav("confirmation");
    },
    notify: (event: ConfirmationNotification) => {
      update(() => {
        return { ...event };
      });
    }
  };
}
export const fullPageLoadingScreen = initFullPageLoadingScreen();

function initFullPageLoadingScreen() {
  const { subscribe, set, update } = writable<{
    isShow: boolean;
    text: string;
  }>({ isShow: false, text: "loading..." });
  return {
    subscribe,
    set: (m: any) => {
      set(m);
    },
    reset: () => {
      update(() => {
        return { isShow: false, text: "loading..." };
      });
    },
    show: (text: string) => {
      update(() => {
        return { isShow: true, text };
      });
    },
    hide: () => {
      update(() => {
        return { isShow: false, text: "loading..." };
      });
    }
  };
}

export const inlineToasts = initInlineToastStore();

function initInlineToastStore() {
  const { subscribe, set, update } = writable<InlineToast[]>([]);

  const trigger = (toast: InlineToast) => {
    logger.log({ at: "inlineToast", toast });

    update((toasts: InlineToast[]) => {
      const filtered = toasts.filter((t) => t.id !== toast.id);
      return [...filtered, toast];
    });

    if (typeof window !== "undefined") {
      dispatchCustomEvent(GlobalEvent.INLINE_TOAST, toast);
    }
  };

  const remove = (id: string) => {
    update((toasts: InlineToast[]) => {
      return toasts.filter((t) => t.id !== id);
    });
  };

  return {
    subscribe,
    set,
    trigger,
    remove,
    success: (params: Omit<InlineToast, "type">) => {
      trigger({
        ...params,
        type: AlertType.SUCCESS
      });
    },

    error: (params: Omit<InlineToast, "type">) => {
      trigger({
        ...params,
        type: AlertType.ERROR
      });
    },

    info: (params: Omit<InlineToast, "type">) => {
      trigger({
        ...params,
        type: AlertType.INFO
      });
    }
  };
}
