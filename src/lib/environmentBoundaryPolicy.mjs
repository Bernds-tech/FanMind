const NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT = "I_UNDERSTAND_NON_PRODUCTION_ONLY";
const RUNTIME_ENVIRONMENTS = new Set(["production", "staging", "test", "development"]);
const WRITE_ENVIRONMENTS = new Set(["staging", "test"]);
const PRODUCTION_HOSTNAMES = new Set(["fanmind.ch", "www.fanmind.ch"]);
const SUPABASE_REF_PATTERN = /^[a-z0-9]{8,40}$/;

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseUrl(value) {
  const raw = clean(value);
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function normalizeRuntimeEnvironment(value) {
  const candidate = clean(value).toLowerCase();
  return RUNTIME_ENVIRONMENTS.has(candidate) ? candidate : "unknown";
}

function normalizeProjectRef(value) {
  const candidate = clean(value).toLowerCase();
  return SUPABASE_REF_PATTERN.test(candidate) ? candidate : null;
}

function supabaseProjectRefFromUrl(value) {
  const url = parseUrl(value);
  if (!url) return null;
  const hostname = url.hostname.toLowerCase();
  const match = hostname.match(/^([a-z0-9]{8,40})\.supabase\.co$/);
  return match ? match[1] : null;
}

function appTarget(environment) {
  const url = parseUrl(
    environment.NEXT_PUBLIC_APP_URL
      ?? environment.NEXT_PUBLIC_SITE_URL
      ?? environment.FANMIND_APP_URL,
  );
  return {
    configured: Boolean(url),
    hostname: url?.hostname.toLowerCase() ?? null,
    secure: url?.protocol === "https:",
    production: url ? PRODUCTION_HOSTNAMES.has(url.hostname.toLowerCase()) : false,
  };
}

function supabaseTarget(environment) {
  const url = parseUrl(environment.NEXT_PUBLIC_SUPABASE_URL);
  const extractedRef = supabaseProjectRefFromUrl(environment.NEXT_PUBLIC_SUPABASE_URL);
  const explicitRef = normalizeProjectRef(environment.FANMIND_TARGET_SUPABASE_PROJECT_REF);
  const projectRef = extractedRef ?? explicitRef;
  const productionRef = normalizeProjectRef(
    environment.FANMIND_PRODUCTION_SUPABASE_PROJECT_REF,
  );
  return {
    configured: Boolean(url),
    secure: url?.protocol === "https:",
    projectRef,
    productionRef,
    productionMatch: Boolean(projectRef && productionRef && projectRef === productionRef),
    standardProjectUrl: Boolean(extractedRef),
  };
}

export function evaluateEnvironmentBoundary(
  environment = {},
  { allowWrite = false } = {},
) {
  const errors = [];
  const warnings = [];
  const runtimeEnvironment = normalizeRuntimeEnvironment(
    environment.FANMIND_RUNTIME_ENVIRONMENT,
  );
  const app = appTarget(environment);
  const supabase = supabaseTarget(environment);
  const writesEnabled = clean(environment.FANMIND_ENABLE_NON_PRODUCTION_WRITES) === "true";
  const acknowledgement = clean(environment.FANMIND_NON_PRODUCTION_WRITE_ACK);

  if (runtimeEnvironment === "unknown") {
    errors.push("FANMIND_RUNTIME_ENVIRONMENT muss production, staging, test oder development sein.");
  }
  if (!app.configured) {
    errors.push("Eine gültige FanMind-Ziel-URL fehlt.");
  } else if (!app.secure && app.hostname !== "localhost" && app.hostname !== "127.0.0.1") {
    errors.push("FanMind-Ziel-URLs müssen HTTPS verwenden.");
  }
  if (!supabase.configured) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL fehlt oder ist ungültig.");
  } else if (!supabase.secure) {
    errors.push("Supabase-Ziel-URLs müssen HTTPS verwenden.");
  }

  if (runtimeEnvironment === "production" && app.configured && !app.production) {
    errors.push("Production muss auf fanmind.ch oder www.fanmind.ch zeigen.");
  }
  if (runtimeEnvironment !== "production" && runtimeEnvironment !== "unknown" && app.production) {
    errors.push("Nicht-produktive Umgebungen dürfen nicht auf fanmind.ch zeigen.");
  }
  if (runtimeEnvironment === "production" && supabase.productionRef && supabase.projectRef && !supabase.productionMatch) {
    errors.push("Production zeigt nicht auf das bestätigte Production-Supabase-Projekt.");
  }

  if (allowWrite) {
    if (!WRITE_ENVIRONMENTS.has(runtimeEnvironment)) {
      errors.push("Schreibtests sind ausschließlich in staging oder test erlaubt.");
    }
    if (!writesEnabled) {
      errors.push("Schreibtests verlangen FANMIND_ENABLE_NON_PRODUCTION_WRITES=true.");
    }
    if (acknowledgement !== NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT) {
      errors.push(
        `Schreibtests verlangen FANMIND_NON_PRODUCTION_WRITE_ACK=${NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT}.`,
      );
    }
    if (app.production) {
      errors.push("Schreibtests dürfen niemals gegen fanmind.ch laufen.");
    }
    if (!app.configured || !app.secure) {
      errors.push("Schreibtests verlangen eine gültige HTTPS-Staging-/Test-URL.");
    }
    if (!supabase.projectRef) {
      errors.push("Schreibtests verlangen eine eindeutig erkennbare Ziel-Supabase-Projektreferenz.");
    }
    if (!supabase.productionRef) {
      errors.push("Schreibtests verlangen FANMIND_PRODUCTION_SUPABASE_PROJECT_REF zum Vergleich.");
    }
    if (supabase.productionMatch) {
      errors.push("Schreibtests dürfen niemals das Production-Supabase-Projekt verwenden.");
    }
  } else if (writesEnabled) {
    errors.push("Read-only Preflight verlangt FANMIND_ENABLE_NON_PRODUCTION_WRITES=false.");
  }

  if (!allowWrite && runtimeEnvironment !== "production" && runtimeEnvironment !== "unknown") {
    warnings.push("Nicht-produktive Umgebung erkannt; Schreibzugriff bleibt ohne --allow-write gesperrt.");
  }
  if (supabase.configured && !supabase.standardProjectUrl && !supabase.projectRef) {
    warnings.push("Supabase-Custom-Domain erkannt; FANMIND_TARGET_SUPABASE_PROJECT_REF sollte gesetzt werden.");
  }
  if (runtimeEnvironment === "production" && !supabase.productionRef) {
    warnings.push("Production-Supabase-Projektreferenz ist noch nicht als Vergleichswert dokumentiert.");
  }

  return {
    ok: errors.length === 0,
    mode: allowWrite ? "non-production-write" : "read-only",
    runtimeEnvironment,
    writesEnabled,
    appConfigured: app.configured,
    appHostnameConfigured: Boolean(app.hostname),
    appProduction: app.production,
    appSecure: app.secure,
    supabaseConfigured: supabase.configured,
    supabaseProjectIdentified: Boolean(supabase.projectRef),
    productionProjectIdentified: Boolean(supabase.productionRef),
    supabaseProductionMatch: supabase.productionMatch,
    errors,
    warnings,
  };
}

export {
  NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT,
  normalizeRuntimeEnvironment,
  supabaseProjectRefFromUrl,
};
