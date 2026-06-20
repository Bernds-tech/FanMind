#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dbUrl =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.SUPABASE_DB_URL ??
  "";

if (!dbUrl) {
  console.error(
    "DATABASE_URL oder POSTGRES_URL oder SUPABASE_DB_URL fehlt. Migration wurde nicht ausgefuehrt.",
  );
  process.exit(1);
}

const sqlFile = resolve(
  process.cwd(),
  "supabase/migrations/20260618100000_create_contact_reply_targets.sql",
);

if (!existsSync(sqlFile)) {
  console.error(`SQL-Datei nicht gefunden: ${sqlFile}`);
  process.exit(1);
}

const sql = readFileSync(sqlFile, "utf8");
const run = spawnSync("psql", [dbUrl, "-v", "ON_ERROR_STOP=1"], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});

if (run.error) {
  if (run.error.code === "ENOENT") {
    console.error("psql ist nicht installiert oder nicht im PATH verfügbar.");
  } else {
    console.error(`Migration konnte nicht gestartet werden: ${run.error.message}`);
  }
  process.exit(1);
}

if ((run.status ?? 1) !== 0) {
  process.exit(run.status ?? 1);
}

console.log("Migration erfolgreich angewendet: contact_reply_targets");
