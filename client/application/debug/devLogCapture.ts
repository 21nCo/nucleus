import { browser } from "$app/environment";

type LogLevel = "log" | "warn" | "error" | "unhandledrejection" | "windowerror";

type SerializedValue =
  | string
  | number
  | boolean
  | null
  | SerializedValue[]
  | { [key: string]: SerializedValue };

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  product?: string;
  href: string;
  path: string;
  args: SerializedValue[];
}

interface DevLogCaptureOptions {
  product?: string;
  endpoint?: string | null;
  flushIntervalMs?: number;
  maxEntries?: number;
}

const DEFAULT_FLUSH_INTERVAL_MS = 2000;
const DEFAULT_MAX_ENTRIES = 5000;

let isInstalled = false;
let flushTimer: ReturnType<typeof setInterval> | undefined;
let maxEntries = DEFAULT_MAX_ENTRIES;
let endpoint: string | undefined;
let productName: string | undefined;
const buffer: LogEntry[] = [];

function now() {
  return new Date().toISOString();
}

function serializeValue(
  value: unknown,
  seen = new WeakSet<object>()
): SerializedValue {
  if (value === null) return null;
  if (value === undefined) return "undefined";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "function") {
    return `[Function ${value.name || "anonymous"}]`;
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? ""
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item, seen));
  }
  if (typeof value === "object") {
    if (seen.has(value)) return "[Circular]";
    seen.add(value);
    const output: Record<string, SerializedValue> = {};
    for (const [key, item] of Object.entries(value)) {
      output[key] = serializeValue(item, seen);
    }
    seen.delete(value);
    return output;
  }
  return String(value);
}

function entryToText(entry: LogEntry) {
  return `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.product ?? "unknown"} ${entry.path} ${entry.args
    .map((arg) =>
      typeof arg === "string" ? arg : JSON.stringify(arg)
    )
    .join(" ")}`;
}

function pushEntry(level: LogLevel, args: unknown[]) {
  const entry: LogEntry = {
    timestamp: now(),
    level,
    product: productName,
    href: window.location.href,
    path: window.location.pathname + window.location.search,
    args: args.map((arg) => serializeValue(arg))
  };
  buffer.push(entry);
  if (buffer.length > maxEntries) {
    buffer.splice(0, buffer.length - maxEntries);
  }
}

async function flushEntries(entries: LogEntry[]) {
  if (!endpoint || entries.length === 0) return;
  try {
    await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ entries }),
      keepalive: true
    });
  } catch {}
}

export async function flushNow() {
  if (!browser || !endpoint || buffer.length === 0) return;
  const entries = buffer.splice(0, buffer.length);
  await flushEntries(entries);
}

function flushWithBeacon() {
  if (
    !browser ||
    !endpoint ||
    buffer.length === 0 ||
    typeof navigator.sendBeacon !== "function"
  ) {
    return;
  }
  const entries = buffer.splice(0, buffer.length);
  const body = JSON.stringify({ entries });
  navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
}

export function initDevLogCapture(options: DevLogCaptureOptions = {}) {
  if (!browser || !import.meta.env.DEV || isInstalled) return;
  isInstalled = true;
  endpoint = options.endpoint ?? undefined;
  maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  productName = options.product;
  const flushIntervalMs = options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS;

  const originalLog = console.log.bind(console);
  const originalWarn = console.warn.bind(console);
  const originalError = console.error.bind(console);

  console.log = (...args: unknown[]) => {
    pushEntry("log", args);
    originalLog(...args);
  };

  console.warn = (...args: unknown[]) => {
    pushEntry("warn", args);
    originalWarn(...args);
  };

  console.error = (...args: unknown[]) => {
    pushEntry("error", args);
    originalError(...args);
  };

  window.addEventListener("error", (event) => {
    pushEntry("windowerror", [
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: serializeValue(event.error)
      }
    ]);
  });

  window.addEventListener("unhandledrejection", (event) => {
    pushEntry("unhandledrejection", [event.reason]);
  });

  (window as unknown as Record<string, unknown>).__getDevLogs = () =>
    buffer.map(entryToText).join("\n");
  (window as unknown as Record<string, unknown>).__clearDevLogs = () => {
    buffer.length = 0;
    return "Cleared";
  };
  (window as unknown as Record<string, unknown>).__flushDevLogs = async () => {
    await flushNow();
    return "Flushed";
  };

  if (flushTimer) clearInterval(flushTimer);
  flushTimer = setInterval(() => {
    void flushNow();
  }, flushIntervalMs);

  window.addEventListener("beforeunload", flushWithBeacon);
}
