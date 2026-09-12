import { writable } from "svelte/store";
import { postMessageToParent } from "@nucleum/client/runtime/embed/embed.utils";
import { EmbedMessage } from "@nucleum/client/runtime/embed/embedMessage.enum";
/** A scheduled focus reminder delivered through the native notification contract. */
export type ScheduledNotification = {
  inSeconds: number;
  message: string;
  title?: string;
  timestamp: number;
  sound?: string;
  id: string;
};

/** Pending focus notifications delivered by the application shell. */
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
