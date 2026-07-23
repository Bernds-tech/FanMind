import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

import {
  addSecureStorageRegistryKey,
  normalizeSecureStorageRegistry,
  removeSecureStorageRegistryKey,
} from "@/lib/secureStorageRegistry.mjs";

const CHUNK_SIZE = 1800;
const COUNT_SUFFIX = ":count";
const REGISTRY_KEY = "fanmind:secure-storage-registry:v1";
const SECURE_OPTIONS = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
} as const;

function chunkKey(key: string, index: number): string {
  return `${key}:chunk:${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const value = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

async function readRegistry(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(REGISTRY_KEY);
  return normalizeSecureStorageRegistry(raw);
}

async function writeRegistry(keys: string[]): Promise<void> {
  if (!keys.length) {
    await SecureStore.deleteItemAsync(REGISTRY_KEY);
    return;
  }
  await SecureStore.setItemAsync(REGISTRY_KEY, JSON.stringify(keys), SECURE_OPTIONS);
}

async function registerKey(key: string): Promise<void> {
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
  await SecureStore.deleteItemAsync(`${key}${COUNT_SUFFIX}`);
}

export async function clearSecureSessionStorage(): Promise<void> {
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

  await SecureStore.deleteItemAsync(REGISTRY_KEY);
}

export const secureSessionStorage: SupportedStorage = {
  async getItem(key: string): Promise<string | null> {
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

    // Existing installations created before the registry was introduced are
    // enrolled on first successful read so the next logout can purge them.
    await registerKey(key);
    return chunks.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    const chunkCount = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
    const chunks = Array.from(
      { length: chunkCount },
      (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );
    for (const [index, chunk] of chunks.entries()) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunk, SECURE_OPTIONS);
    }
    await SecureStore.setItemAsync(
      `${key}${COUNT_SUFFIX}`,
      String(chunks.length),
      SECURE_OPTIONS,
    );
    await registerKey(key);
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
    await unregisterKey(key);
  },
};
