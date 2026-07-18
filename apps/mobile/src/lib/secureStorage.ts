import * as SecureStore from "expo-secure-store";
import type { SupportedStorage } from "@supabase/supabase-js";

const CHUNK_SIZE = 1800;
const COUNT_SUFFIX = ":count";

function chunkKey(key: string, index: number): string {
  return `${key}:chunk:${index}`;
}

async function readChunkCount(key: string): Promise<number> {
  const value = await SecureStore.getItemAsync(`${key}${COUNT_SUFFIX}`);
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
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
      return null;
    }
    return chunks.join("");
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    const chunks = Array.from(
      { length: Math.ceil(value.length / CHUNK_SIZE) },
      (_, index) => value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
    );
    for (const [index, chunk] of chunks.entries()) {
      await SecureStore.setItemAsync(chunkKey(key, index), chunk, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }
    await SecureStore.setItemAsync(
      `${key}${COUNT_SUFFIX}`,
      String(chunks.length),
      { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
    );
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
  },
};
