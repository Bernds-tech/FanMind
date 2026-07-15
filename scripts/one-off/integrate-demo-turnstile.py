#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# Server: central fail-closed Turnstile configuration policy.
# ---------------------------------------------------------------------------
path = "src/lib/demoProtection.ts"
text = read(path)
if 'from "@/lib/demoTurnstilePolicy.mjs"' not in text:
    text = replace_once(
        text,
        '} from "@/lib/supabase/config";\n',
        '} from "@/lib/supabase/config";\nimport { resolveDemoTurnstilePolicy } from "@/lib/demoTurnstilePolicy.mjs";\n',
        "demo protection policy import",
    )

old = '''  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  if (!secret && !siteKey) return { ok: true, error: null };
  if (!secret || !siteKey) {
    return {
      ok: false,
      error: "Der Demo-Bot-Schutz ist unvollständig konfiguriert.",
    };
  }
'''
new = '''  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  const policy = resolveDemoTurnstilePolicy({
    required:
      process.env.FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO === "true",
    siteKey,
    secretKey: secret,
  });

  if (policy.mode === "disabled") return { ok: true, error: null };
  if (policy.mode === "misconfigured") {
    return {
      ok: false,
      error: policy.required
        ? "Der vorgeschriebene Demo-Bot-Schutz ist serverseitig nicht vollständig konfiguriert."
        : "Der Demo-Bot-Schutz ist unvollständig konfiguriert.",
    };
  }
'''
text = replace_once(text, old, new, "Turnstile server policy")
write(path, text)


# ---------------------------------------------------------------------------
# Login: explicit SPA widget, token forwarding, expiry/error reset.
# ---------------------------------------------------------------------------
path = "src/app/login/page.tsx"
text = read(path)
if 'from "@/components/DemoTurnstile"' not in text:
    text = replace_once(
        text,
        'import { FanMindLogo } from "@/components/FanMindLogo";\n',
        'import { FanMindLogo } from "@/components/FanMindLogo";\nimport { DemoTurnstile } from "@/components/DemoTurnstile";\n',
        "login Turnstile import",
    )

if "const TURNSTILE_SITE_KEY" not in text:
    text = replace_once(
        text,
        '''const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_FANMIND_DEMO_PASSWORD ?? "FanMind-Demo-2026!";
''',
        '''const DEMO_PASSWORD =
  process.env.NEXT_PUBLIC_FANMIND_DEMO_PASSWORD ?? "FanMind-Demo-2026!";
const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
''',
        "login Turnstile site key",
    )

if "turnstileResetSignal" not in text:
    text = replace_once(
        text,
        '''  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
''',
        '''  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetSignal, setTurnstileResetSignal] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
''',
        "login Turnstile state",
    )

old = '''  async function handleDemoStart() {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: language }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        redirectTo?: string;
      } | null;

      if (!response.ok) {
        setError(
          `${payload?.error ?? "Die Demo konnte gerade nicht vorbereitet werden."} Du kannst den kontrollierten Sandra-Demo-Zugang über /login?demo=1 nutzen.`,
        );
        return;
      }

      window.location.assign(payload?.redirectTo ?? LOGIN_TARGET);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Die Demo konnte gerade nicht vorbereitet werden. Bitte nutze /login?demo=1 als Fallback.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
'''
new = '''  function resetTurnstile() {
    if (!TURNSTILE_SITE_KEY) return;
    setTurnstileToken(null);
    setTurnstileResetSignal((current) => current + 1);
  }

  async function handleDemoStart() {
    setError(null);

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(
        language === "en"
          ? "Please confirm bot protection before starting the public demo."
          : "Bitte bestätige den Bot-Schutz, bevor du die öffentliche Demo startest.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: language,
          turnstileToken: turnstileToken ?? undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        code?: string;
        error?: string;
        redirectTo?: string;
      } | null;

      if (!response.ok) {
        resetTurnstile();
        setError(
          `${payload?.error ?? "Die Demo konnte gerade nicht vorbereitet werden."} Du kannst den kontrollierten Sandra-Demo-Zugang über /login?demo=1 nutzen.`,
        );
        return;
      }

      window.location.assign(payload?.redirectTo ?? LOGIN_TARGET);
    } catch (startError) {
      resetTurnstile();
      setError(
        startError instanceof Error
          ? startError.message
          : "Die Demo konnte gerade nicht vorbereitet werden. Bitte nutze /login?demo=1 als Fallback.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
'''
text = replace_once(text, old, new, "login demo start token flow")

old = '''            <button
              className={styles.secondaryButton}
              type="button"
              onClick={handleDemoStart}
              disabled={isSubmitting}
            >
'''
new = '''            <DemoTurnstile
              siteKey={TURNSTILE_SITE_KEY}
              language={language}
              resetSignal={turnstileResetSignal}
              onTokenChange={setTurnstileToken}
            />

            <button
              className={styles.secondaryButton}
              type="button"
              onClick={handleDemoStart}
              disabled={
                isSubmitting || Boolean(TURNSTILE_SITE_KEY && !turnstileToken)
              }
            >
'''
text = replace_once(text, old, new, "login Turnstile widget placement")

for required in [
    "turnstileToken: turnstileToken ?? undefined",
    "<DemoTurnstile",
    "TURNSTILE_SITE_KEY && !turnstileToken",
]:
    if required not in text:
        raise SystemExit(f"login Turnstile integration missing: {required}")
write(path, text)


# ---------------------------------------------------------------------------
# Environment contract and production runbook.
# ---------------------------------------------------------------------------
path = ".env.example"
text = read(path)
old = '''# Optional Cloudflare Turnstile. When a site key is exposed, the secret must be configured server-side.
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
'''
new = '''# Optional Cloudflare Turnstile browser widget plus mandatory server-side token validation.
# Keep required=false until both keys are configured and the widget has been tested.
FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
'''
text = replace_once(text, old, new, "Turnstile environment contract")
write(path, text)

path = "docs/operations/public-demo-protection-runbook.md"
text = read(path)
old = '''Turnstile bleibt zunächst leer, bis das Browser-Widget ebenfalls verdrahtet und getestet ist:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```
'''
new = '''Turnstile ist zusätzlich zum Datenbank-Rate-Limit vorbereitet. Solange die Schlüssel noch nicht eingerichtet sind, bleibt der verpflichtende Modus aus:

```env
FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=false
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Sobald im Cloudflare-Dashboard ein Widget für `fanmind.ch` angelegt wurde:

1. öffentlichen Site Key in `NEXT_PUBLIC_TURNSTILE_SITE_KEY` setzen;
2. geheimen Schlüssel ausschließlich serverseitig in `TURNSTILE_SECRET_KEY` setzen;
3. Anwendung neu bauen und PM2 mit aktualisierter Umgebung starten;
4. Widget im Browser lösen und einen erfolgreichen Demo-Start prüfen;
5. abgelaufenen, fehlerhaften und wiederverwendeten Token prüfen;
6. erst danach `FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=true` setzen.

Bei nur einem gesetzten Schlüssel oder bei `required=true` ohne vollständige Konfiguration blockiert FanMind den öffentlichen Demo-Start. Der Turnstile-Token wird vom Browser an `/api/demo/start` übergeben und dort serverseitig gegen Siteverify, Hostname und Action `fanmind_demo_start` geprüft. Rate-Limit, Kapazitätslimit und Cleanup bleiben unabhängig davon aktiv.
'''
text = replace_once(text, old, new, "Turnstile runbook")
write(path, text)


# ---------------------------------------------------------------------------
# Tests and Product Truth gates.
# ---------------------------------------------------------------------------
path = "package.json"
package = json.loads(read(path))
operations = package["scripts"]["test:operations"]
new_test = "tests/demo-turnstile-policy.test.mjs"
if new_test not in operations:
    package["scripts"]["test:operations"] = f"{operations} {new_test}"
write(path, json.dumps(package, ensure_ascii=False, indent=2) + "\n")

path = "scripts/verify-product-truth.mjs"
text = read(path)
runtime_anchor = '''  "src/lib/aiUsagePolicy.mjs",
  "src/lib/workspaceAiUsage.ts",
'''
runtime_replacement = '''  "src/lib/aiUsagePolicy.mjs",
  "src/lib/demoTurnstilePolicy.mjs",
  "src/lib/workspaceAiUsage.ts",
'''
if '  "src/lib/demoTurnstilePolicy.mjs",\n' not in text:
    text = replace_once(
        text,
        runtime_anchor,
        runtime_replacement,
        "truth runtime Turnstile policy",
    )

component_anchor = '''  "src/components/FanMindFunctionIcon.tsx",
  "src/components/WorkspaceShell.tsx",
'''
component_replacement = '''  "src/components/FanMindFunctionIcon.tsx",
  "src/components/DemoTurnstile.tsx",
  "src/components/WorkspaceShell.tsx",
'''
if '  "src/components/DemoTurnstile.tsx",\n' not in text:
    text = replace_once(
        text,
        component_anchor,
        component_replacement,
        "truth runtime Turnstile component",
    )

for entry, anchor in [
    ('  "src/lib/demoProtection.ts",\n', '  "src/lib/demoTurnstilePolicy.mjs",\n'),
    ('  "src/app/login/page.tsx",\n', '  "src/app/landing-v2/page.tsx",\n'),
    ('  "tests/demo-turnstile-policy.test.mjs",\n', '  "tests/ai-usage-policy.test.mjs",\n'),
]:
    if entry not in text:
        text = replace_once(text, anchor, anchor + entry, f"truth runtime {entry.strip()}")

checks = '''requireText(
  ".env.example",
  "FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO=false",
  "Turnstile muss vor vollständiger Schlüsselkonfiguration optional und ausdrücklich deaktivierbar bleiben.",
);
requireText(
  "src/lib/demoTurnstilePolicy.mjs",
  'mode: "misconfigured"',
  "Unvollständige Turnstile-Konfiguration muss fail-closed behandelt werden.",
);
requireText(
  "src/lib/demoProtection.ts",
  'FANMIND_REQUIRE_TURNSTILE_FOR_PUBLIC_DEMO === "true"',
  "Der öffentliche Demo-Endpunkt muss den verpflichtenden Turnstile-Modus serverseitig auswerten.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  "Das Browser-Widget muss die offizielle Turnstile-API direkt und explizit laden.",
);
requireText(
  "src/components/DemoTurnstile.tsx",
  'action: "fanmind_demo_start"',
  "Widget und Server müssen dieselbe Turnstile-Action verwenden.",
);
requireText(
  "src/app/login/page.tsx",
  "turnstileToken: turnstileToken ?? undefined",
  "Die Loginseite muss den gelösten Token an den geschützten Demo-Endpunkt übergeben.",
);
requireText(
  "tests/demo-turnstile-policy.test.mjs",
  "Turnstile required mode fails closed before both keys are configured",
  "Der verpflichtende Turnstile-Modus muss automatisiert auf unvollständige Konfiguration getestet werden.",
);

'''
if "Turnstile muss vor vollständiger Schlüsselkonfiguration" not in text:
    anchor = '''forbidIn(
  "src/app/landing-v2/page.tsx",
'''
    if anchor not in text:
        raise SystemExit("truth Turnstile insertion anchor missing")
    text = text.replace(anchor, checks + anchor, 1)
write(path, text)

print("Public demo Turnstile UI, fail-closed policy, tests and runbook integrated.")
