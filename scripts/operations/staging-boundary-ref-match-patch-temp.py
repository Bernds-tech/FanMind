#!/usr/bin/env python3
from pathlib import Path
from textwrap import dedent


def block(value: str) -> str:
    return dedent(value).lstrip("\n")


def replace_once(path: str, old: str, new: str, label: str) -> None:
    target = Path(path)
    source = target.read_text(encoding="utf-8")
    old_value = block(old)
    new_value = block(new)
    if old_value not in source:
        raise SystemExit(f"missing_anchor:{label}")
    target.write_text(source.replace(old_value, new_value, 1), encoding="utf-8")


replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
    function clean(value) {
      return typeof value === "string" ? value.trim() : "";
    }
    """,
    """
    function clean(value) {
      return typeof value === "string" ? value.trim() : "";
    }

    function firstNonEmpty(...values) {
      for (const value of values) {
        const candidate = clean(value);
        if (candidate) return candidate;
      }
      return "";
    }
    """,
    "first_non_empty",
)

replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
    function appTarget(environment) {
      const url = parseUrl(
        environment.NEXT_PUBLIC_APP_URL
          ?? environment.NEXT_PUBLIC_SITE_URL
          ?? environment.FANMIND_APP_URL,
      );
      const hostname = url ? normalizeHostname(url.hostname) : null;
      return {
        configured: Boolean(url),
        hostname,
        secure: url?.protocol === "https:",
        production: hostname ? PRODUCTION_HOSTNAMES.has(hostname) : false,
      };
    }
    """,
    """
    function appTarget(environment) {
      const url = parseUrl(
        firstNonEmpty(
          environment.NEXT_PUBLIC_APP_URL,
          environment.NEXT_PUBLIC_SITE_URL,
          environment.FANMIND_APP_URL,
        ),
      );
      const hostname = url ? normalizeHostname(url.hostname) : null;
      return {
        configured: Boolean(url),
        hostname,
        secure: url?.protocol === "https:",
        production: hostname ? PRODUCTION_HOSTNAMES.has(hostname) : false,
      };
    }
    """,
    "app_target_fallback",
)

replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
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
    """,
    """
    function supabaseTarget(environment) {
      const rawUrl = clean(environment.NEXT_PUBLIC_SUPABASE_URL);
      const url = parseUrl(rawUrl);
      const urlProjectRef = supabaseProjectRefFromUrl(rawUrl);
      const explicitProjectRef = normalizeProjectRef(
        environment.FANMIND_TARGET_SUPABASE_PROJECT_REF,
      );
      const projectRef = urlProjectRef ?? explicitProjectRef;
      const productionRef = normalizeProjectRef(
        environment.FANMIND_PRODUCTION_SUPABASE_PROJECT_REF,
      );
      const targetRefMismatch = Boolean(
        urlProjectRef
          && explicitProjectRef
          && urlProjectRef !== explicitProjectRef,
      );
      return {
        configured: Boolean(url),
        secure: url?.protocol === "https:",
        urlProjectRef,
        explicitProjectRef,
        projectRef,
        productionRef,
        productionMatch: Boolean(projectRef && productionRef && projectRef === productionRef),
        targetRefMismatch,
        targetRefMatchesUrl: Boolean(
          urlProjectRef
            && explicitProjectRef
            && urlProjectRef === explicitProjectRef,
        ),
        standardProjectUrl: Boolean(urlProjectRef),
      };
    }
    """,
    "supabase_target",
)

replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
      if (!supabase.configured) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL fehlt oder ist ungültig.");
      } else if (!supabase.secure) {
        errors.push("Supabase-Ziel-URLs müssen HTTPS verwenden.");
      }

      if (runtimeEnvironment === "production" && app.configured && !app.production) {
    """,
    """
      if (!supabase.configured) {
        errors.push("NEXT_PUBLIC_SUPABASE_URL fehlt oder ist ungültig.");
      } else if (!supabase.secure) {
        errors.push("Supabase-Ziel-URLs müssen HTTPS verwenden.");
      }
      if (supabase.targetRefMismatch) {
        errors.push(
          "NEXT_PUBLIC_SUPABASE_URL und FANMIND_TARGET_SUPABASE_PROJECT_REF müssen dasselbe Supabase-Projekt benennen.",
        );
      }

      if (runtimeEnvironment === "production" && app.configured && !app.production) {
    """,
    "supabase_mismatch_error",
)

replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
        if (!supabase.projectRef) {
          errors.push("Schreibtests verlangen eine eindeutig erkennbare Ziel-Supabase-Projektreferenz.");
        }
        if (!supabase.productionRef) {
    """,
    """
        if (!supabase.projectRef) {
          errors.push("Schreibtests verlangen eine eindeutig erkennbare Ziel-Supabase-Projektreferenz.");
        }
        if (!supabase.explicitProjectRef) {
          errors.push(
            "Schreibtests verlangen FANMIND_TARGET_SUPABASE_PROJECT_REF als explizite Zielbestätigung.",
          );
        }
        if (!supabase.productionRef) {
    """,
    "write_explicit_ref",
)

replace_once(
    "src/lib/environmentBoundaryPolicy.mjs",
    """
        supabaseConfigured: supabase.configured,
        supabaseProjectIdentified: Boolean(supabase.projectRef),
        productionProjectIdentified: Boolean(supabase.productionRef),
        supabaseProductionMatch: supabase.productionMatch,
    """,
    """
        supabaseConfigured: supabase.configured,
        supabaseProjectIdentified: Boolean(supabase.projectRef),
        supabaseUrlProjectIdentified: Boolean(supabase.urlProjectRef),
        supabaseExplicitProjectIdentified: Boolean(supabase.explicitProjectRef),
        supabaseTargetRefMismatch: supabase.targetRefMismatch,
        supabaseTargetRefMatchesUrl: supabase.targetRefMatchesUrl,
        productionProjectIdentified: Boolean(supabase.productionRef),
        supabaseProductionMatch: supabase.productionMatch,
    """,
    "boundary_result_fields",
)

replace_once(
    "scripts/environment-boundary-preflight.mjs",
    """
    console.log(`SUPABASE_TARGET=${result.supabaseProjectIdentified ? "identified" : "unknown"}`);
    console.log(`PRODUCTION_SUPABASE_REFERENCE=${result.productionProjectIdentified ? "identified" : "missing"}`);
    console.log(`SUPABASE_MATCHES_PRODUCTION=${result.supabaseProductionMatch ? "yes" : "no"}`);
    console.log(`NON_PRODUCTION_WRITES=${result.writesEnabled ? "enabled" : "disabled"}`);
    """,
    """
    console.log(`SUPABASE_TARGET=${result.supabaseProjectIdentified ? "identified" : "unknown"}`);
    console.log(`SUPABASE_URL_PROJECT_REF=${result.supabaseUrlProjectIdentified ? "identified" : "missing"}`);
    console.log(`SUPABASE_EXPLICIT_TARGET_REF=${result.supabaseExplicitProjectIdentified ? "identified" : "missing"}`);
    console.log(
      `SUPABASE_TARGET_REF_MATCHES_URL=${
        result.supabaseTargetRefMismatch
          ? "no"
          : result.supabaseTargetRefMatchesUrl
            ? "yes"
            : "unknown"
      }`,
    );
    console.log(`PRODUCTION_SUPABASE_REFERENCE=${result.productionProjectIdentified ? "identified" : "missing"}`);
    console.log(`SUPABASE_MATCHES_PRODUCTION=${result.supabaseProductionMatch ? "yes" : "no"}`);
    console.log(`NON_PRODUCTION_WRITES=${result.writesEnabled ? "enabled" : "disabled"}`);
    """,
    "environment_preflight_output",
)

replace_once(
    "scripts/staging-readiness-preflight.mjs",
    """
    if (!boundary.supabaseProjectIdentified || !boundary.productionProjectIdentified) {
      errors.push("Staging- und Production-Supabase-Projektreferenz müssen identifiziert sein.");
    }

    if (boundary.supabaseProductionMatch) {
    """,
    """
    if (!boundary.supabaseProjectIdentified || !boundary.productionProjectIdentified) {
      errors.push("Staging- und Production-Supabase-Projektreferenz müssen identifiziert sein.");
    }

    if (!boundary.supabaseUrlProjectIdentified) {
      errors.push("Staging benötigt eine standardisierte Supabase-Projekt-URL mit erkennbarer Projektreferenz.");
    }

    if (!boundary.supabaseExplicitProjectIdentified) {
      errors.push("FANMIND_TARGET_SUPABASE_PROJECT_REF muss als explizite Staging-Zielbestätigung gesetzt sein.");
    }

    if (boundary.supabaseTargetRefMismatch || !boundary.supabaseTargetRefMatchesUrl) {
      errors.push("Supabase-URL und explizite Staging-Zielreferenz müssen exakt übereinstimmen.");
    }

    if (boundary.supabaseProductionMatch) {
    """,
    "staging_ref_checks",
)

replace_once(
    "scripts/staging-readiness-preflight.mjs",
    """
    configured("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    configured("SUPABASE_SERVICE_ROLE_KEY");
    """,
    """
    configured("FANMIND_TARGET_SUPABASE_PROJECT_REF");
    configured("FANMIND_PRODUCTION_SUPABASE_PROJECT_REF");
    configured("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    configured("SUPABASE_SERVICE_ROLE_KEY");
    """,
    "staging_configured_refs",
)

replace_once(
    "scripts/staging-readiness-preflight.mjs",
    """
    console.log(`STAGING_SUPABASE_TARGET=${boundary.supabaseProjectIdentified && !boundary.supabaseProductionMatch ? "separate" : "invalid"}`);
    console.log(`STAGING_STRIPE_MODE=${value("STRIPE_SECRET_KEY").startsWith("sk_test_") ? "test" : "invalid"}`);
    """,
    """
    console.log(`STAGING_SUPABASE_TARGET=${boundary.supabaseProjectIdentified && !boundary.supabaseProductionMatch ? "separate" : "invalid"}`);
    console.log(
      `STAGING_SUPABASE_REF_BINDING=${
        boundary.supabaseTargetRefMatchesUrl && !boundary.supabaseTargetRefMismatch
          ? "matching"
          : "invalid"
      }`,
    );
    console.log(`STAGING_STRIPE_MODE=${value("STRIPE_SECRET_KEY").startsWith("sk_test_") ? "test" : "invalid"}`);
    """,
    "staging_output",
)

replace_once(
    "tests/environment-boundary-policy.test.mjs",
    """
    test("preflight output never prints actual URLs, project refs or secret values", () => {
    """,
    """
    test("app target skips an empty primary URL and uses the first configured fallback", () => {
      const result = evaluateEnvironmentBoundary({
        ...stagingEnvironment,
        NEXT_PUBLIC_APP_URL: "   ",
        NEXT_PUBLIC_SITE_URL: "https://staging-fallback.fanmind.example",
      });

      assert.equal(result.ok, true);
      assert.equal(result.appConfigured, true);
      assert.equal(result.appProduction, false);
      assert.equal(result.appSecure, true);
    });

    test("Supabase URL and explicit target reference must identify the same project", () => {
      const matching = evaluateEnvironmentBoundary(stagingEnvironment);
      assert.equal(matching.ok, true);
      assert.equal(matching.supabaseUrlProjectIdentified, true);
      assert.equal(matching.supabaseExplicitProjectIdentified, true);
      assert.equal(matching.supabaseTargetRefMatchesUrl, true);
      assert.equal(matching.supabaseTargetRefMismatch, false);

      const mismatchedEnvironment = {
        ...stagingEnvironment,
        FANMIND_TARGET_SUPABASE_PROJECT_REF: "differentref123",
      };
      const readOnly = evaluateEnvironmentBoundary(mismatchedEnvironment);
      assert.equal(readOnly.ok, false);
      assert.equal(readOnly.supabaseTargetRefMismatch, true);
      assert.equal(readOnly.supabaseTargetRefMatchesUrl, false);
      assert.match(readOnly.errors.join("\\n"), /dasselbe Supabase-Projekt/);

      const write = evaluateEnvironmentBoundary(
        {
          ...mismatchedEnvironment,
          FANMIND_ENABLE_NON_PRODUCTION_WRITES: "true",
          FANMIND_NON_PRODUCTION_WRITE_ACK: NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT,
        },
        { allowWrite: true },
      );
      assert.equal(write.ok, false);
      assert.equal(write.supabaseTargetRefMismatch, true);
    });

    test("write mode requires an explicit target reference even for a standard Supabase URL", () => {
      const result = evaluateEnvironmentBoundary(
        {
          ...stagingEnvironment,
          FANMIND_TARGET_SUPABASE_PROJECT_REF: "",
          FANMIND_ENABLE_NON_PRODUCTION_WRITES: "true",
          FANMIND_NON_PRODUCTION_WRITE_ACK: NON_PRODUCTION_WRITE_ACKNOWLEDGEMENT,
        },
        { allowWrite: true },
      );

      assert.equal(result.ok, false);
      assert.equal(result.supabaseUrlProjectIdentified, true);
      assert.equal(result.supabaseExplicitProjectIdentified, false);
      assert.match(result.errors.join("\\n"), /explizite Zielbestätigung/);
    });

    test("preflight output never prints actual URLs, project refs or secret values", () => {
    """,
    "environment_tests",
)

replace_once(
    "tests/staging-readiness-policy.test.mjs",
    """
      assert.match(script, /FANMIND_ENABLE_REFERRAL_BILLING/);
      assert.match(script, /STAGING_READINESS=OK/);
    """,
    """
      assert.match(script, /FANMIND_ENABLE_REFERRAL_BILLING/);
      assert.match(script, /FANMIND_TARGET_SUPABASE_PROJECT_REF/);
      assert.match(script, /Supabase-URL und explizite Staging-Zielreferenz müssen exakt übereinstimmen/);
      assert.match(script, /STAGING_SUPABASE_REF_BINDING/);
      assert.match(script, /STAGING_READINESS=OK/);
    """,
    "staging_policy_assertions",
)

replace_once(
    "tests/staging-readiness-policy.test.mjs",
    """
      assert.match(runbook, /keine Live-Kunden/);
      assert.match(runbook, /ersetzt nicht die externen Ressourcen/);
    """,
    """
      assert.match(runbook, /keine Live-Kunden/);
      assert.match(runbook, /exakt der Projektreferenz in der Supabase-URL entsprechen/);
      assert.match(runbook, /ersetzt nicht die externen Ressourcen/);
    """,
    "staging_runbook_assertions",
)

replace_once(
    "docs/operations/STAGING_PROVISIONING.md",
    """
       - eigenes Auth, Datenbank, Storage und Service-Role-Key;
       - ausschließlich synthetische Kontakte, Nachrichten und Dateien;
    """,
    """
       - eigenes Auth, Datenbank, Storage und Service-Role-Key;
       - `FANMIND_TARGET_SUPABASE_PROJECT_REF` muss exakt der Projektreferenz in der Supabase-URL entsprechen;
       - Abweichungen zwischen URL und expliziter Zielreferenz werden fail-closed abgelehnt;
       - ausschließlich synthetische Kontakte, Nachrichten und Dateien;
    """,
    "runbook_supabase_binding",
)

replace_once(
    "docs/operations/STAGING_PROVISIONING.md",
    """
    1. externe Ressourcen erstellen;
    2. `.env.staging.example` außerhalb von Git befüllen;
    3. alle Schreibschalter auf `false` lassen;
    4. `npm run staging:preflight` ausführen;
    5. Workflow `FanMind Staging Readiness` manuell starten;
    6. erst für einen ausdrücklich beschriebenen Testfall `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` und die exakte Bestätigung setzen;
    7. nach dem Test Schreibfreigabe sofort wieder deaktivieren;
    8. synthetische Testdaten und temporäre Artefakte kontrolliert löschen.
    """,
    """
    1. externe Ressourcen erstellen;
    2. `.env.staging.example` außerhalb von Git befüllen;
    3. die Projektreferenz aus `NEXT_PUBLIC_SUPABASE_URL` exakt in `FANMIND_TARGET_SUPABASE_PROJECT_REF` übernehmen;
    4. alle Schreibschalter auf `false` lassen;
    5. `npm run staging:preflight` ausführen;
    6. Workflow `FanMind Staging Readiness` manuell starten;
    7. erst für einen ausdrücklich beschriebenen Testfall `FANMIND_ENABLE_NON_PRODUCTION_WRITES=true` und die exakte Bestätigung setzen;
    8. nach dem Test Schreibfreigabe sofort wieder deaktivieren;
    9. synthetische Testdaten und temporäre Artefakte kontrolliert löschen.
    """,
    "runbook_safe_sequence",
)

replace_once(
    "docs/operations/STAGING_PROVISIONING.md",
    """
    - Supabase-Projekt nachweislich von Production getrennt ist;
    - Stripe Test Mode verwendet wird;
    """,
    """
    - Supabase-Projekt nachweislich von Production getrennt ist;
    - URL-Projektreferenz und explizite Staging-Zielreferenz exakt übereinstimmen;
    - Stripe Test Mode verwendet wird;
    """,
    "runbook_release_criteria",
)

replace_once(
    ".env.staging.example",
    """
    # Required comparison values for any write-enabled test.
    FANMIND_TARGET_SUPABASE_PROJECT_REF=stagingprojectref
    """,
    """
    # Required comparison values for any write-enabled test.
    # The target ref must exactly equal the project subdomain in NEXT_PUBLIC_SUPABASE_URL.
    FANMIND_TARGET_SUPABASE_PROJECT_REF=stagingprojectref
    """,
    "staging_template_binding",
)
