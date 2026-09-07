// typeSafeEventPropagation.ts
import { setContext, getContext } from "svelte";
import { writable, type Writable } from "svelte/store";

type EventCallback = (detail: any) => void;
type EventListeners = Record<string, EventCallback[]>;

interface EventContext {
  addEventListener: (eventName: string, callback: EventCallback) => void;
  removeEventListener: (eventName: string, callback: EventCallback) => void;
  dispatchEvent: (eventName: string, detail: any) => void;
}

export function createEventPropagator(
  uniqueKey: string = "defaultEventPropagator"
) {
  const eventListeners: Writable<EventListeners> = writable({});

  const eventContext: EventContext = {
    addEventListener: (eventName: string, callback: EventCallback) => {
      eventListeners.update((listeners) => {
        if (!listeners[eventName]) {
          listeners[eventName] = [];
        }
        listeners[eventName].push(callback);
        return listeners;
      });
    },
    removeEventListener: (eventName: string, callback: EventCallback) => {
      eventListeners.update((listeners) => {
        if (listeners[eventName]) {
          listeners[eventName] = listeners[eventName].filter(
            (cb) => cb !== callback
          );
        }
        return listeners;
      });
    },
    dispatchEvent: (eventName: string, detail: any) => {
      eventListeners.update((listeners) => {
        if (listeners[eventName]) {
          listeners[eventName].forEach((callback) => callback(detail));
        }
        return listeners;
      });
    }
  };

  return {
    setEventContext: () => setContext<EventContext>(uniqueKey, eventContext),
    getEventContext: () => getContext<EventContext>(uniqueKey)
  };
}
