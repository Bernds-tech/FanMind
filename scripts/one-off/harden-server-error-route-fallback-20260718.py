#!/usr/bin/env python3
from pathlib import Path

path = Path("src/lib/serverErrorTelemetry.ts")
text = path.read_text(encoding="utf-8")
old = '''export function normalizeRoutePath(routePath: unknown, requestPath: unknown): string {
  const primary = typeof routePath === "string" ? routePath : "";
  const fallback = typeof requestPath === "string" ? requestPath : "";
  const raw = primary || fallback || "/unknown";
  const withoutQuery = raw.split("?", 1)[0].split("#", 1)[0];
'''
new = '''export function normalizeRoutePath(routePath: unknown, _requestPath: unknown): string {
  const primary = typeof routePath === "string" ? routePath : "";
  const raw = primary || "/unknown";
  const withoutQuery = raw.split("?", 1)[0].split("#", 1)[0];
'''
if text.count(old) != 1:
    raise SystemExit("route fallback anchor mismatch")
path.write_text(text.replace(old, new, 1), encoding="utf-8")
print("Server error route fallback hardened.")
