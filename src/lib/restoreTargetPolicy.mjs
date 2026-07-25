import { isIP } from "node:net";
import { isAbsolute } from "node:path";

import { evaluateEnvironmentBoundary } from "./environmentBoundaryPolicy.mjs";

const RESTORE_TARGET_ACKNOWLEDGEMENT =
  "I_UNDERSTAND_EMPTY_DISPOSABLE_DATABASE_ONLY";
const SIMPLE_DATABASE_IDENTIFIER = /^[A-Za-z0-9_.-]{1,128}$/;
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DIRECT_SUPABASE_HOST = /^db\.([a-z0-9]{8,40})\.supabase\.co$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeHost(value) {
  let candidate = clean(value).toLowerCase();
  if (!candidate) return null;

  if (candidate.startsWith("[") && candidate.endsWith("]")) {
    candidate = candidate.slice(1, -1);
  }

  candidate = candidate.replace(/\.+$/, "");
  if (isIP(candidate)) return candidate;

  const labels = candidate.split(".");
  if (!labels.length || labels.some((label) => !HOST_LABEL.test(label))) {
    return null;
  }

  return candidate;
}

function normalizePort(value) {
  const candidate = clean(value);
  if (!/^\d{1,5}$/.test(candidate)) return null;

  const port = Number(candidate);
  return port >= 1 && port <= 65535 ? String(port) : null;
}

function normalizeIdentifier(value) {
  const candidate = clean(value);
  return SIMPLE_DATABASE_IDENTIFIER.test(candidate) ? candidate : null;
}

function databaseTarget(environment, names) {
  const raw = {
    host: clean(environment[names.host]),
    port: clean(environment[names.port]),
    database: clean(environment[names.database]),
    user: clean(environment[names.user]),
  };
  const normalized = {
    host: normalizeHost(raw.host),
    port: normalizePort(raw.port),
    database: normalizeIdentifier(raw.database),
    user: normalizeIdentifier(raw.user),
  };
  const complete = Object.values(raw).every(Boolean);
  const valid = complete && Object.values(normalized).every(Boolean);

  return {
    complete,
    valid,
    host: normalized.host,
    signature: valid
      ? [
          normalized.host,
          normalized.port,
          normalized.database,
          normalized.user,
        ].join("\u0000")
      : null,
  };
}

function sameTarget(left, right) {
  return Boolean(left.valid && right.valid && left.signature === right.signature);
}

export function evaluateRestoreTarget(environment = {}) {
  const errors = [];
  const warnings = [];
  const environmentBoundary = evaluateEnvironmentBoundary(environment, {
    allowWrite: true,
  });
  const restoreEnabled =
    clean(environment.FANMIND_ENABLE_RESTORE_DRILL) === "true";
  const acknowledgementConfirmed =
    clean(environment.FANMIND_RESTORE_TARGET_ACK)
      === RESTORE_TARGET_ACKNOWLEDGEMENT;
  const actualTarget = databaseTarget(environment, {
    host: "PGHOST",
    port: "PGPORT",
    database: "PGDATABASE",
    user: "PGUSER",
  });
  const expectedTarget = databaseTarget(environment, {
    host: "FANMIND_RESTORE_TARGET_DB_HOST",
    port: "FANMIND_RESTORE_TARGET_DB_PORT",
    database: "FANMIND_RESTORE_TARGET_DB_NAME",
    user: "FANMIND_RESTORE_TARGET_DB_USER",
  });
  const productionTarget = databaseTarget(environment, {
    host: "FANMIND_PRODUCTION_DB_HOST",
    port: "FANMIND_PRODUCTION_DB_PORT",
    database: "FANMIND_PRODUCTION_DB_NAME",
    user: "FANMIND_PRODUCTION_DB_USER",
  });
  const hiddenTargetOverrides = [
    "PGHOSTADDR",
    "PGSERVICE",
    "PGSERVICEFILE",
  ].filter((name) => clean(environment[name]));
  const passfilePath = clean(environment.PGPASSFILE);
  const passfileConfigured = Boolean(passfilePath);
  const passfileAbsolute = passfileConfigured && isAbsolute(passfilePath);
  const passwordInEnvironment = Boolean(clean(environment.PGPASSWORD));
  const targetSupabaseProjectRef = clean(
    environment.FANMIND_TARGET_SUPABASE_PROJECT_REF,
  ).toLowerCase();
  const directSupabaseMatch = actualTarget.host?.match(DIRECT_SUPABASE_HOST);
  const sharedSupabasePooler = Boolean(
    actualTarget.host?.endsWith(".pooler.supabase.com"),
  );

  for (const error of environmentBoundary.errors) {
    errors.push(`Umgebungsgrenze: ${error}`);
  }
  for (const warning of environmentBoundary.warnings) {
    warnings.push(`Umgebungsgrenze: ${warning}`);
  }

  if (!restoreEnabled) {
    errors.push("Restore-Drill verlangt FANMIND_ENABLE_RESTORE_DRILL=true.");
  }
  if (!acknowledgementConfirmed) {
    errors.push(
      `Restore-Drill verlangt FANMIND_RESTORE_TARGET_ACK=${RESTORE_TARGET_ACKNOWLEDGEMENT}.`,
    );
  }
  if (!actualTarget.complete) {
    errors.push("PGHOST, PGPORT, PGDATABASE und PGUSER müssen vollständig gesetzt sein.");
  } else if (!actualTarget.valid) {
    errors.push(
      "PG*-Zielwerte müssen einfache Host-, Port-, Datenbank- und Benutzerwerte sein; Connection-Strings und Mehrfach-Hosts sind verboten.",
    );
  }
  if (!expectedTarget.complete) {
    errors.push(
      "Die explizite Restore-Zielbestätigung mit FANMIND_RESTORE_TARGET_DB_HOST, _PORT, _NAME und _USER fehlt.",
    );
  } else if (!expectedTarget.valid) {
    errors.push("Die explizite Restore-Zielbestätigung enthält ungültige Werte.");
  }
  if (!productionTarget.complete) {
    errors.push(
      "Der Production-Vergleich mit FANMIND_PRODUCTION_DB_HOST, _PORT, _NAME und _USER fehlt.",
    );
  } else if (!productionTarget.valid) {
    errors.push("Der Production-Datenbankvergleich enthält ungültige Werte.");
  }

  const targetConfirmed = sameTarget(actualTarget, expectedTarget);
  if (actualTarget.valid && expectedTarget.valid && !targetConfirmed) {
    errors.push(
      "Die von pg_restore verwendeten PG*-Werte stimmen nicht exakt mit der expliziten Restore-Zielbestätigung überein.",
    );
  }

  const productionSeparated =
    actualTarget.valid
    && productionTarget.valid
    && !sameTarget(actualTarget, productionTarget);
  if (
    actualTarget.valid
    && productionTarget.valid
    && !productionSeparated
  ) {
    errors.push("Das pg_restore-Ziel entspricht exakt der Production-Datenbank.");
  }
  if (sharedSupabasePooler) {
    errors.push(
      "Shared Supabase-Pooler sind für den Restore-Drill gesperrt; einen projektspezifischen direkten DB-Host verwenden.",
    );
  }
  if (
    directSupabaseMatch
    && directSupabaseMatch[1] !== targetSupabaseProjectRef
  ) {
    errors.push(
      "Der direkte Supabase-DB-Host gehört nicht zur bestätigten nicht-produktiven Zielprojektreferenz.",
    );
  }

  if (hiddenTargetOverrides.length) {
    errors.push(
      "PGHOSTADDR, PGSERVICE und PGSERVICEFILE dürfen beim Restore-Drill nicht gesetzt sein.",
    );
  }
  if (!passfileConfigured) {
    errors.push("Restore-Drill verlangt einen geschützten PGPASSFILE-Pfad.");
  } else if (!passfileAbsolute) {
    errors.push("PGPASSFILE muss ein absoluter Pfad sein.");
  }
  if (passwordInEnvironment) {
    errors.push("PGPASSWORD ist beim Restore-Drill verboten; PGPASSFILE verwenden.");
  }

  return {
    ok: errors.length === 0,
    mode: "isolated-restore-write",
    restoreEnabled,
    acknowledgementConfirmed,
    environmentBoundaryOk: environmentBoundary.ok,
    actualTargetComplete: actualTarget.complete,
    actualTargetValid: actualTarget.valid,
    expectedTargetComplete: expectedTarget.complete,
    expectedTargetValid: expectedTarget.valid,
    productionTargetComplete: productionTarget.complete,
    productionTargetValid: productionTarget.valid,
    targetConfirmed,
    productionSeparated,
    directSupabaseProjectBound: Boolean(
      !directSupabaseMatch
      || directSupabaseMatch[1] === targetSupabaseProjectRef,
    ),
    sharedSupabasePooler,
    hiddenTargetOverridesClear: hiddenTargetOverrides.length === 0,
    passfileConfigured,
    passfileAbsolute,
    passwordInEnvironment,
    errors,
    warnings,
  };
}

export {
  RESTORE_TARGET_ACKNOWLEDGEMENT,
  normalizeHost,
  normalizePort,
};
