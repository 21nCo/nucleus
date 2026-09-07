import { LogType } from "@nucleum/components/debug/debug.type";

const LOG_METHODS: Record<LogType, "debug" | "error" | "info" | "warn"> = {
  [LogType.ERROR]: "error",
  [LogType.WARN]: "warn",
  [LogType.INFO]: "info",
  [LogType.TRACE]: "debug",
  [LogType.DEBUG]: "debug"
};

const DEBUG_SINK_URL =
  import.meta.env?.VITE_DEBUG_SINK_URL ??
  (typeof window !== "undefined"
    ? window.localStorage?.getItem("debugSinkUrl")
    : undefined);
const DEBUG_SINK_TOKEN =
  import.meta.env?.VITE_DEBUG_SINK_TOKEN ??
  (typeof window !== "undefined"
    ? window.localStorage?.getItem("debugSinkToken")
    : undefined);
const REDACTED = "[REDACTED]";
const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "token",
  "accessToken",
  "refreshToken",
  "authfnToken",
  "authfnWidgetToken",
  "challengeId",
  "password",
  "pass",
  "email",
  "identifier",
  "otp",
  "code",
  "codeHash",
  "clientSecret",
  "client_secret",
  "id_token"
];

class Logger {
  level: LogType = LogType.ERROR;
  private globalListenersInstalled = false;
  constructor() {
    this.setDefaultLevel();
    this.installGlobalListeners();
  }

  setDefaultLevel() {
    try {
      if (
        typeof window !== "undefined" &&
        window?.location?.search?.includes("log=")
      ) {
        const logQueryParam = window?.location?.search
          .split("?")[1]
          ?.split("&")
          .find((x) => x.startsWith("log="));
        const logLevel = logQueryParam?.split("=")[1];
        this.level = +(logLevel ?? "0") as LogType;
      } else {
        const defaultLevel =
          import.meta.env?.VITE_LOG_LEVEL ??
          (typeof process !== "undefined" ? process.env?.PLASMO_PUBLIC_LOG_LEVEL : undefined) ??
          LogType.INFO;
        this.level = Number(defaultLevel) as LogType;
      }
    } catch (e) {
      console.error("Error setting log level", e);
      this.level = LogType.ERROR;
    }
  }

  private _console(message: unknown, type: LogType) {
    const payload =
      typeof message === "object" && message !== null
        ? { ...(message as Record<string, unknown>), t: new Date().toISOString() }
        : { message, t: new Date().toISOString() };
    console[LOG_METHODS[type]](payload);
    this.sendToDebugSink(payload, type);
  }
  private _log(message: unknown, type: LogType) {
    if (type <= this.level) {
      this._console(message, type);
    }
  }
  log(
    message: unknown,
    type: LogType.INFO | LogType.TRACE | LogType.DEBUG = LogType.TRACE
  ) {
    this._log(message, type);
  }
  info(message: unknown) {
    this._log(message, LogType.INFO);
  }
  error(message: unknown, error?: unknown) {
    this._log({ message, error }, LogType.ERROR);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("errorLog", {
          detail: {
            error,
            message
          }
        })
      );
    }
  }
  warn(message: unknown) {
    this._log(message, LogType.WARN);
  }
  debug(message: unknown) {
    this._console(message, LogType.DEBUG);
  }

  setLevel(level: LogType) {
    this.level = level;
  }

  private installGlobalListeners() {
    if (
      this.globalListenersInstalled ||
      typeof window === "undefined" ||
      !resolveDebugSinkUrl()
    ) {
      return;
    }
    this.globalListenersInstalled = true;
    window.addEventListener("error", (event) => {
      this.sendToDebugSink(
        {
          at: "window.error",
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: serializeError(event.error)
        },
        LogType.ERROR
      );
    });
    window.addEventListener("unhandledrejection", (event) => {
      this.sendToDebugSink(
        {
          at: "window.unhandledrejection",
          reason: serializeError(event.reason)
        },
        LogType.ERROR
      );
    });
  }

  private sendToDebugSink(message: unknown, type: LogType) {
    const sinkUrl = resolveDebugSinkUrl();
    if (!sinkUrl || typeof fetch === "undefined") return;
    const nativeConfig = resolveNativeConfig();
    const payload = redact({
      level: LOG_METHODS[type],
      source: "web",
      product: import.meta.env?.VITE_PRODUCT ?? nativeConfig?.product,
      environment: import.meta.env?.VITE_ENV ?? nativeConfig?.environment,
      route:
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      message,
      payload: message
    });
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    const token = resolveDebugSinkToken();
    if (token) headers["x-debug-sink-token"] = token;
    void fetch(`${sinkUrl}/v1/logs`, {
      method: "POST",
      headers,
      body,
      keepalive: body.length < 60_000
    }).catch(() => {
      // Logging must never affect product behavior.
    });
  }
}

export const logger = new Logger();

function resolveDebugSinkUrl() {
  const value =
    DEBUG_SINK_URL ??
    (typeof window !== "undefined"
      ? window.localStorage?.getItem("debugSinkUrl") ??
        window.__NUCLEUM_NATIVE_CONFIG__?.debugSinkUrl
      : undefined);
  return value?.trim().replace(/\/$/, "");
}

function resolveDebugSinkToken() {
  return (
    DEBUG_SINK_TOKEN ??
    (typeof window !== "undefined"
      ? window.localStorage?.getItem("debugSinkToken")
      : undefined)
  )?.trim();
}

function resolveNativeConfig() {
  return typeof window !== "undefined"
    ? window.__NUCLEUM_NATIVE_CONFIG__
    : undefined;
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return "<max-depth>";
  if (Array.isArray(value)) return value.map((entry) => redact(entry, depth + 1));
  if (value instanceof Error) return serializeError(value);
  if (typeof value === "string") return redactSensitiveString(value);
  if (typeof value !== "object" || value === null) return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive.toLowerCase()))) {
      result[key] = REDACTED;
    } else {
      result[key] = redact(entry, depth + 1);
    }
  }
  return result;
}

function redactSensitiveString(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, REDACTED)
    .replace(/\b(chal|otp|state|code|token)_[A-Za-z0-9._~-]+\b/g, REDACTED)
    .replace(/([?&](?:code|state|id_token|access_token|refresh_token)=)[^&\s]+/gi, `$1${REDACTED}`);
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  return error;
}
