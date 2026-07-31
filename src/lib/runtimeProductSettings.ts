import "server-only";

import { randomUUID } from "node:crypto";
import { chmod, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type RuntimeProductSettings = {
  publicDailyTestPlanEnabled: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

function getSettingsPath(): string {
  const configured = process.env.FANMIND_RUNTIME_SETTINGS_FILE?.trim();
  if (configured) return configured;
  return process.env.NODE_ENV === "production"
    ? "/var/www/fanmind/.fanmind-runtime-settings.json"
    : path.join(
        /* turbopackIgnore: true */ process.cwd(),
        ".fanmind-runtime-settings.json",
      );
}

function environmentFallback(): boolean {
  return process.env.FANMIND_ENABLE_PUBLIC_DAILY_TEST_PLAN === "true";
}

export async function getPublicDailyTestPlanEnabled(): Promise<boolean> {
  try {
    const payload = JSON.parse(
      await readFile(
        /* turbopackIgnore: true */ getSettingsPath(),
        "utf8",
      ),
    ) as Partial<RuntimeProductSettings>;
    return payload.publicDailyTestPlanEnabled === true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return environmentFallback();
    return false;
  }
}

export async function setPublicDailyTestPlanEnabled(
  enabled: boolean,
  updatedBy: string,
): Promise<void> {
  const settingsPath = getSettingsPath();
  const temporaryPath = `${settingsPath}.${randomUUID()}.tmp`;
  const payload: RuntimeProductSettings = {
    publicDailyTestPlanEnabled: enabled,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  await writeFile(temporaryPath, `${JSON.stringify(payload)}\n`, {
    encoding: "utf8",
    mode: 0o600,
    flag: "wx",
  });

  try {
    await rename(temporaryPath, settingsPath);
    await chmod(settingsPath, 0o600);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}
