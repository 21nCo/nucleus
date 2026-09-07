interface ChromeEventLike {
  addListener(listener: (...args: any[]) => void): void;
  removeListener(listener: (...args: any[]) => void): void;
}

interface ChromePortLike {
  postMessage(message: any): void;
  disconnect(): void;
  onMessage?: ChromeEventLike;
  onDisconnect?: ChromeEventLike;
}

interface ChromeRuntimeLike {
  id?: string;
  lastError?: unknown;
  connect(connectInfo?: { name?: string }): ChromePortLike;
  getURL?(path: string): string;
  onMessage: ChromeEventLike;
  sendMessage(message: any, callback?: (response: any) => void): void;
}

interface ChromeStorageAreaLike {
  clear(callback?: () => void): Promise<void> | void;
  get(keys?: any, callback?: (items: any) => void): Promise<any> | void;
  remove(keys: any, callback?: () => void): Promise<void> | void;
  set(items: any, callback?: () => void): Promise<void> | void;
}

interface ChromeTabsLike {
  create(createProperties: any, callback?: (tab: chrome.tabs.Tab) => void): void;
  query(queryInfo: any, callback: (tabs: chrome.tabs.Tab[]) => void): void;
  sendMessage(
    tabId: number | undefined,
    message: any,
    callback?: (response: any) => void,
  ): void;
  update(updateProperties: any, callback?: (tab: chrome.tabs.Tab) => void): void;
}

declare namespace chrome {
  namespace tabs {
    interface Tab {
      active?: boolean;
      id?: number;
      url?: string;
      [key: string]: any;
    }
  }
}

declare var chrome: {
  runtime: ChromeRuntimeLike;
  storage: {
    local: ChromeStorageAreaLike;
  };
  tabs: ChromeTabsLike;
  [key: string]: any;
};

interface Window {
  chrome?: typeof chrome;
}
