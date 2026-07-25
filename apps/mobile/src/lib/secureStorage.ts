import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

import {
  addSecureStorageRegistryKey,
  normalizeSecureStorageRegistry,
  removeSecureStorageRegistryKey,
} from "@/lib/secureStorageRegistry.mjs";
import {
  assertSecureStorageLogicalKey,
  SECURE_STORAGE_REGISTRY_KEY,
  secureStoreChunkKey,
  secureStoreCountKey,
} from "@/lib/secureStorageKeyPolicy.mjs";
import { createSerialOperationQueue } from "@/lib/serialOperationQueue.mjs";
import { splitUtf8String } from "@/lib/utf8StoragePolicy.mjs";

const CHUNK_SIZE_BYTES = 1800;
const MAX_SESSION_CHUNKS = 64;
const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;
const secureStorageOperations = createSerialOperationQueue();

function chunkKey(key: string, index: number): string {
  return secureStoreChunkKey(key, index);
}

async function readChunkCount(key: string): Promise<number> {
  const value = await SecureStore.getItemAsync(secureStoreCountKey(key));
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_SESSION_CHUNKS
    ? parsed
    : 0;
}

async function readRegistry(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(SECURE_STORAGE_REGISTRY_KEY);
  return normalizeSecureStorageRegistry(raw);
}

async function writeRegistry(keys: string[]): Promise<void> {
  if (!keys.length) {
    await SecureStore.deleteItemAsync(SECURE_STORAGE_REGISTRY_KEY);
    return;
  }
  await SecureStore.setItemAsync(
    SECURE_STORAGE_REGISTRY_KEY,
    JSON.stringify(keys),
    SECURE_OPTIONS,
  );
}

async function registerKey(key: string): Promise<void> {
  assertSecureStorageLogicalKey(key);
  const keys = addSecureStorageRegistryKey(await readRegistry(), key);
  if (!keys.includes(key)) {
    throw new Error("SecureStore-Schlüssel konnte nicht sicher registriert werden.");
  }
  await writeRegistry(keys);
}

async function unregisterKey(key: string): Promise<void> {
  const keys = removeSecureStorageRegistryKey(await readRegistry(), key);
  await writeRegistry(keys);
}

async function removeChunks(key: string): Promise<void> {
  const count = await readChunkCount(key);
  await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.deleteItemAsync(chunkKey(key, index)),
    ),
  );
  await SecureStore.deleteItemAsync(secureStoreCountKey(key));
}

async function clearSecureLocalStorageInternal(): Promise<void> {
  const keys = await readRegistry();
  const failedKeys: string[] = [];

  for (const key of keys) {
    try {
      await removeChunks(key);
    } catch {
      failedKeys.push(key);
    }
  }

  if (failedKeys.length > 0) {
    await writeRegistry(failedKeys);
    throw new Error("Nicht alle sicheren FanMind-Schlüssel konnten entfernt werden.");
  }

  await SecureStore.deleteItemAsync(SECURE_STORAGE_REGISTRY_KEY);
}

async function getItemInternal(key: string): Promise<string | null> {
  assertSecureStorageLogicalKey(key);
  const count = await readChunkCount(key);
  if (!count) return null;
  const chunks = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.getItemAsync(chunkKey(key, index)),
    ),
  );
  if (chunks.some((chunk) => chunk === null)) {
    await removeChunks(key);
    await unregisterKey(key);
    return null;
  }

  // Existing valid keys that predate registry enrollment are added on first
  // successful read so the next logout can purge them.
  await registerKey(key);
  return chunks.join("");
}

async function setItemInternal(key: string, value: string): Promise<void> {
  assertSecureStorageLogicalKey(key);
  await removeChunks(key);
  const chunks = splitUtf8String(value, CHUNK_SIZE_BYTES);
  if (chunks.length > MAX_SESSION_CHUNKS) {
    throw new Error(
      "Sichere lokale FanMind-Daten überschreiten die Speichergrenze.",
    );
  }

  // Register first and persist the expected count before the chunks. If any
  // subsequent write fails, the cleanup path can still find every expected
  // chunk and the registry keeps failed cleanup work retryable.
  await registerKey(key);
  try {
    await SecureStore.setItemAsync(
      secureStoreCountKey(key),
      String(chunks.length),
      SECURE_OPTIONS,
    );
    for (const [index, chunk] of chunks.entries()) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunk, SECURE_OPTIONS);
    }
  } catch (error) {
    let chunksRemoved = false;
    try {
      await removeChunks(key);
      chunksRemoved = true;
    } catch {
      // Keep the key registered so a later logout can retry the purge.
    }
    if (chunksRemoved) {
      try {
        await unregisterKey(key);
      } catch {
        // A stale registry entry is safer than unregistered local data.
      }
    }
    throw error;
  }
}

async function removeItemInternal(key: string): Promise<void> {
  assertSecureStorageLogicalKey(key);
  await removeChunks(key);
  await unregisterKey(key);
}

export function clearSecureLocalStorage(): Promise<void> {
  return secureStorageOperations.run(clearSecureLocalStorageInternal);
}

// Kept as a compatibility alias for existing callers while the generic name
// makes the session plus bounded offline-cache purge explicit.
export const clearSecureSessionStorage = clearSecureLocalStorage;

export const secureSessionStorage: SupportedStorage = {
  getItem(key: string): Promise<string | null> {
    return secureStorageOperations.run(() => getItemInternal(key));
  },

  setItem(key: string, value: string): Promise<void> {
    return secureStorageOperations.run(() => setItemInternal(key, value));
  },

  removeItem(key: string): Promise<void> {
    return secureStorageOperations.run(() => removeItemInternal(key));
  },
};
