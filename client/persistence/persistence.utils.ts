import type { JsonValue } from "@nucleum/persistence/json.type";
import { Resource } from "@nucleum/datafn/resource.enum";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { isExtensionEnvironment } from "@21n/utils/browser.utils";
import { generateSimpleRandomId } from "@21n/shared-utils/crypto.utils";
import { parse, stringify } from "@21n/shared-utils/json.utils";

type ClientStoragePayload = Partial<Record<ClientStorageKey, string | null>>;

function getBrowserStorage(type: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return null;
  try {
    return window[type] ?? null;
  } catch {
    return null;
  }
}

export function resetLocalStorage() {
  const storage = getBrowserStorage("localStorage");
  if (import.meta.env?.SSR || !import.meta.env || !storage) {
    return;
  }
  storage.clear();
  window.location.reload();
}

export function persistLocally<T extends JsonValue>(
  itemType: Resource,
  item: T
) {
  if (import.meta.env?.SSR || !import.meta.env) {
    return;
  }
  getBrowserStorage("localStorage")?.setItem(
    Resource[itemType],
    stringify(item)
  );
}
export function retrieveLocally(itemType: Resource) {
  try {
    if (import.meta.env?.SSR || !import.meta.env) {
      return null;
    }
    let value = getBrowserStorage("localStorage")?.getItem(Resource[itemType]);
    if (value) {
      return parse(value);
    } else {
      return null;
    }
  } catch {
    return null;
  }
}

class ClientKeyValueStorage {
  isExtensionEnvironment = isExtensionEnvironment();

  private isExtensionStorageAvailable() {
    return (
      this.isExtensionEnvironment &&
      typeof chrome !== "undefined" &&
      !!chrome.storage?.local
    );
  }

  get(key: ClientStorageKey): Promise<string | null> {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function (data: ClientStoragePayload) {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(data[key] ?? null);
          }
        });
      });
    } else {
      return Promise.resolve(
        getBrowserStorage("localStorage")?.getItem(key) ?? null
      );
    }
  }

  set(key: ClientStorageKey, value: any): Promise<any> {
    if (typeof value === "object") {
      value = stringify(value);
    }
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, function () {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(value);
          }
        });
      });
    } else {
      getBrowserStorage("localStorage")?.setItem(key, value);
      return Promise.resolve(value);
    }
  }

  remove(key: ClientStorageKey) {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, function () {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(key);
          }
        });
      });
    } else {
      getBrowserStorage("localStorage")?.removeItem(key);
      return Promise.resolve(key);
    }
  }
  getForSession(key: ClientStorageKey) {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function (data: ClientStoragePayload) {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(data[key] ?? null);
          }
        });
      });
    } else {
      return Promise.resolve(
        getBrowserStorage("sessionStorage")?.getItem(key) ?? null
      );
    }
  }

  setForSession(key: ClientStorageKey, value: any) {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, function () {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(value);
          }
        });
      });
    } else {
      getBrowserStorage("sessionStorage")?.setItem(key, value);
      return Promise.resolve(value);
    }
  }

  removeForSession(key: ClientStorageKey) {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.remove(key, function () {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(key);
          }
        });
      });
    } else {
      getBrowserStorage("sessionStorage")?.removeItem(key);
      return Promise.resolve(key);
    }
  }
  clearAll() {
    if (this.isExtensionStorageAvailable()) {
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(function () {
          if (chrome.runtime?.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(null);
          }
        });
      });
    } else {
      getBrowserStorage("localStorage")?.clear();
      getBrowserStorage("sessionStorage")?.clear();
      return Promise.resolve(null);
    }
  }
}

export const clientStorage = new ClientKeyValueStorage();

export function deleteIndexedDbDatabase(name: string) {
  if (typeof indexedDB === "undefined") return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error(`Unable to delete ${name}`));
    request.onblocked = () => reject(new Error(`Deletion blocked for ${name}`));
  });
}

let dapIdPromise: Promise<string> | null = null;

export async function getDapId() {
  dapIdPromise ??= resolveDapId().finally(() => {
    dapIdPromise = null;
  });
  return dapIdPromise;
}

async function resolveDapId() {
  const dapId = await clientStorage.get(ClientStorageKey.DAP_ID);
  if (dapId) return dapId;
  const generatedDapId = generateSimpleRandomId();
  await clientStorage.set(ClientStorageKey.DAP_ID, generatedDapId);
  return generatedDapId;
}
