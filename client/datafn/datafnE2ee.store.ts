import type { DatafnE2eeProvider } from "@datafn/client";
import { clientStorage } from "@nucleum/persistence/persistence.utils";
import { ClientStorageKey } from "@nucleum/persistence/persistence.type";
import { parse, stringify } from "@21n/shared-utils/json.utils";
import type {
  NucleumDatafnE2eeSettings,
  NucleumDatafnE2eeState
} from "@21n/types/datafn.type";
import { writable } from "svelte/store";

export const DATAFN_E2EE_KV_KEY = "nucleum:e2ee";

const iterations = 250000;
const textEncoder = new TextEncoder();
const localKeys = new Map<string, Uint8Array>();

export const datafnE2eeState = writable<NucleumDatafnE2eeState>({
  enabled: false,
  unlocked: false,
  keyRef: null
});

function getSubtleCrypto() {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("WebCrypto is not available");
  return subtle;
}

function randomBytes(length: number) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array) {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    ""
  );
  if (typeof btoa === "function") return btoa(binary);
  return (globalThis as any).Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value: string) {
  if (typeof atob === "function") {
    const binary = atob(value);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  }
  return Uint8Array.from((globalThis as any).Buffer.from(value, "base64"));
}

function bytesToBufferSource(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

export function validateDatafnE2eePassword(password: string) {
  if (password.length < 12) {
    return {
      ok: false as const,
      message: "Password must be at least 12 characters long."
    };
  }
  if (!password.match(/[a-z]/)) {
    return {
      ok: false as const,
      message: "Password must contain at least one lowercase letter."
    };
  }
  if (!password.match(/[A-Z]/)) {
    return {
      ok: false as const,
      message: "Password must contain at least one uppercase letter."
    };
  }
  if (!password.match(/[0-9]/)) {
    return {
      ok: false as const,
      message: "Password must contain at least one number."
    };
  }
  if (!password.match(/[^a-zA-Z0-9]/)) {
    return {
      ok: false as const,
      message: "Password must contain at least one special character."
    };
  }
  const normalized = password.toLowerCase();
  if (
    normalized.includes("password") ||
    normalized.includes("qwerty") ||
    normalized.includes("123456")
  ) {
    return {
      ok: false as const,
      message: "Password must avoid common words and keyboard patterns."
    };
  }
  if (/(.)\1{3,}/.test(password)) {
    return {
      ok: false as const,
      message: "Password must not repeat the same character too many times."
    };
  }
  return { ok: true as const };
}

function assertStrongPassword(password: string) {
  const validation = validateDatafnE2eePassword(password);
  if (!validation.ok) throw new Error(validation.message);
}

async function derivePasswordKey(
  password: string,
  salt: Uint8Array,
  iterationCount: number
) {
  const subtle = getSubtleCrypto();
  const keyMaterial = await subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: bytesToBufferSource(salt),
      iterations: iterationCount,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function importDek(rawKey: Uint8Array) {
  return getSubtleCrypto().importKey(
    "raw",
    bytesToBufferSource(rawKey),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function wrapDek(rawKey: Uint8Array, password: string) {
  assertStrongPassword(password);
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const passwordKey = await derivePasswordKey(password, salt, iterations);
  const wrapped = await getSubtleCrypto().encrypt(
    { name: "AES-GCM", iv: bytesToBufferSource(iv) },
    passwordKey,
    bytesToBufferSource(rawKey)
  );
  return {
    salt: bytesToBase64(salt),
    wrapIv: bytesToBase64(iv),
    wrappedDek: bytesToBase64(new Uint8Array(wrapped))
  };
}

async function unwrapDek(
  settings: NucleumDatafnE2eeSettings,
  password: string
) {
  if (!settings.salt || !settings.wrapIv || !settings.wrappedDek) {
    throw new Error("E2EE key metadata is missing");
  }
  const passwordKey = await derivePasswordKey(
    password,
    base64ToBytes(settings.salt),
    settings.iterations ?? iterations
  );
  const raw = await getSubtleCrypto().decrypt(
    {
      name: "AES-GCM",
      iv: bytesToBufferSource(base64ToBytes(settings.wrapIv))
    },
    passwordKey,
    bytesToBufferSource(base64ToBytes(settings.wrappedDek))
  );
  return new Uint8Array(raw);
}

async function setLocalKey(keyRef: string, rawKey: Uint8Array) {
  localKeys.set(keyRef, new Uint8Array(rawKey));
}

async function removeLocalKey(keyRef: string | undefined) {
  if (!keyRef) return;
  localKeys.delete(keyRef);
}

function createProvider(
  keyRef: string,
  rawKey: Uint8Array
): DatafnE2eeProvider {
  const keyPromise = importDek(rawKey);
  return {
    keyRef,
    async encrypt({ plaintext, aad }) {
      const iv = randomBytes(12);
      const data = await getSubtleCrypto().encrypt(
        {
          name: "AES-GCM",
          iv: bytesToBufferSource(iv),
          additionalData: bytesToBufferSource(aad)
        },
        await keyPromise,
        bytesToBufferSource(plaintext)
      );
      return {
        __datafnE2ee: 1,
        alg: "AES-GCM",
        keyRef,
        iv: bytesToBase64(iv),
        data: bytesToBase64(new Uint8Array(data))
      };
    },
    async decrypt({ envelope, aad }) {
      if (envelope.keyRef !== keyRef) {
        throw new Error("Encrypted data uses a different key");
      }
      const decrypted = await getSubtleCrypto().decrypt(
        {
          name: "AES-GCM",
          iv: bytesToBufferSource(base64ToBytes(envelope.iv)),
          additionalData: bytesToBufferSource(aad)
        },
        await keyPromise,
        bytesToBufferSource(base64ToBytes(envelope.data))
      );
      return new Uint8Array(decrypted);
    }
  };
}

async function getLocalDatafnE2eeSettingsMap() {
  await clientStorage.remove(ClientStorageKey.DATAFN_E2EE_LOCAL_KEYS);
  const raw = await clientStorage.get(ClientStorageKey.DATAFN_E2EE_SETTINGS);
  if (!raw) return {} as Record<string, NucleumDatafnE2eeSettings>;
  const parsed = typeof raw === "string" ? parse(raw) : raw;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {} as Record<string, NucleumDatafnE2eeSettings>;
  }
  return parsed as Record<string, NucleumDatafnE2eeSettings>;
}

export async function getLocalDatafnE2eeSettings(namespace: string) {
  const settings = await getLocalDatafnE2eeSettingsMap();
  return settings[namespace] ?? null;
}

export async function persistDatafnE2eeSettings(
  namespace: string,
  settings: NucleumDatafnE2eeSettings
) {
  const settingsMap = await getLocalDatafnE2eeSettingsMap();
  settingsMap[namespace] = settings;
  await clientStorage.set(
    ClientStorageKey.DATAFN_E2EE_SETTINGS,
    stringify(settingsMap)
  );
  datafnE2eeState.set({
    enabled: settings.enabled,
    unlocked: settings.enabled && Boolean(settings.keyRef),
    keyRef: settings.keyRef ?? null
  });
}

export async function getCachedDatafnE2eeProvider(
  settings: NucleumDatafnE2eeSettings | null | undefined
) {
  if (!settings?.enabled || !settings.keyRef) return null;
  const rawKey = localKeys.get(settings.keyRef);
  if (!rawKey) return null;
  datafnE2eeState.set({
    enabled: true,
    unlocked: true,
    keyRef: settings.keyRef
  });
  return createProvider(settings.keyRef, rawKey);
}

export async function createDatafnE2eeSetup(
  password: string,
  namespace: string
) {
  assertStrongPassword(password);
  const rawKey = randomBytes(32);
  const keyRef = `e2ee:${Date.now()}:${bytesToBase64(randomBytes(8))}`;
  const wrapped = await wrapDek(rawKey, password);
  const settings: NucleumDatafnE2eeSettings = {
    version: 1,
    enabled: true,
    keyRef,
    iterations,
    updatedAt: Date.now(),
    ...wrapped
  };
  await setLocalKey(keyRef, rawKey);
  await persistDatafnE2eeSettings(namespace, settings);
  return {
    settings,
    provider: createProvider(keyRef, rawKey)
  };
}

export async function unlockDatafnE2eeSettings(
  settings: NucleumDatafnE2eeSettings,
  password: string,
  namespace: string
) {
  if (!settings.enabled || !settings.keyRef) return null;
  const rawKey = await unwrapDek(settings, password);
  await setLocalKey(settings.keyRef, rawKey);
  await persistDatafnE2eeSettings(namespace, settings);
  return createProvider(settings.keyRef, rawKey);
}

export async function rewrapCachedDatafnE2eeKey(
  settings: NucleumDatafnE2eeSettings,
  password: string,
  namespace: string
) {
  assertStrongPassword(password);
  if (!settings.enabled || !settings.keyRef) {
    throw new Error("E2EE is not enabled");
  }
  const cached = localKeys.get(settings.keyRef);
  if (!cached) throw new Error("Unlock E2EE before changing the password");
  const rawKey = cached;
  const wrapped = await wrapDek(rawKey, password);
  const nextSettings: NucleumDatafnE2eeSettings = {
    version: 1,
    enabled: true,
    keyRef: settings.keyRef,
    iterations,
    updatedAt: Date.now(),
    ...wrapped
  };
  await persistDatafnE2eeSettings(namespace, nextSettings);
  return {
    settings: nextSettings,
    provider: createProvider(settings.keyRef, rawKey)
  };
}

export function createDisabledDatafnE2eeSettings() {
  return {
    version: 1,
    enabled: false,
    updatedAt: Date.now()
  } satisfies NucleumDatafnE2eeSettings;
}

export async function disableLocalDatafnE2ee(
  settings: NucleumDatafnE2eeSettings | null | undefined,
  namespace: string,
  disabled: NucleumDatafnE2eeSettings = createDisabledDatafnE2eeSettings()
) {
  await persistDatafnE2eeSettings(namespace, disabled);
  await removeLocalKey(settings?.keyRef);
  datafnE2eeState.set({ enabled: false, unlocked: false, keyRef: null });
  return disabled;
}

export async function clearCachedDatafnE2eeState() {
  localKeys.clear();
  await clientStorage.remove(ClientStorageKey.DATAFN_E2EE_LOCAL_KEYS);
  datafnE2eeState.set({ enabled: false, unlocked: false, keyRef: null });
}
