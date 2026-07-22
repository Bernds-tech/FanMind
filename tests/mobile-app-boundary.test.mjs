import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const mobileRoot = new URL("../apps/mobile/", import.meta.url);
const rootPath = fileURLToPath(root);
const mobileRootPath = fileURLToPath(mobileRoot);
const packageJson = JSON.parse(await readFile(new URL("package.json", mobileRoot), "utf8"));
const appConfig = JSON.parse(await readFile(new URL("app.json", mobileRoot), "utf8"));
const mobileCi = await readFile(new URL("../.github/workflows/ci-mobile.yml", import.meta.url), "utf8");
const mobileReadme = await readFile(new URL("README.md", mobileRoot), "utf8");
const webTsconfig = await readFile(new URL("../tsconfig.json", import.meta.url), "utf8");
const webEslint = await readFile(new URL("../eslint.config.mjs", import.meta.url), "utf8");

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      output.push(...await sourceFiles(path));
    }
    else if (/\.(?:ts|tsx|js|json)$/.test(entry.name)) output.push(path);
  }
  return output;
}

const files = await sourceFiles(mobileRootPath);
const runtimeFiles = files.filter((file) => /[\\/](?:app|src)[\\/]/.test(file));
const runtimeSource = await Promise.all(runtimeFiles.map(async (file) => ({
  file: relative(rootPath, file),
  content: await readFile(file, "utf8"),
})));

test("mobile is a separate Expo package and not a Next application", () => {
  assert.equal(packageJson.name, "@fanmind/mobile");
  assert.equal(packageJson.main, "expo-router/entry");
  assert.match(packageJson.dependencies.expo, /^~57\./);
  assert.equal(packageJson.dependencies.next, undefined);
  assert.equal(packageJson.dependencies["react-dom"], packageJson.dependencies.react);
  assert.equal(packageJson.engines.node, ">=22.13.0");
});

test("Android, iOS and deep-link identities are independent and explicit", () => {
  assert.equal(appConfig.expo.scheme, "fanmind");
  assert.equal(appConfig.expo.ios.bundleIdentifier, "ch.fanmind.app");
  assert.equal(appConfig.expo.android.package, "ch.fanmind.app");
  assert.equal(appConfig.expo.userInterfaceStyle, "dark");
});

test("mobile runtime never imports Website, Next.js, CSS modules or WebView", () => {
  for (const { file, content } of runtimeSource) {
    assert.doesNotMatch(content, /from\s+["'][^"']*src\/(?:app|components)/, file);
    assert.doesNotMatch(content, /from\s+["']next(?:\/|["'])/, file);
    assert.doesNotMatch(content, /\.module\.css|WebView|react-native-webview/, file);
  }
});

test("mobile runtime contains no server-side secret identifiers", async () => {
  for (const { file, content } of runtimeSource) {
    assert.doesNotMatch(
      content,
      /SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|sk_live_|sk_test_/,
      file,
    );
  }
  const envExample = await readFile(new URL(".env.example", mobileRoot), "utf8");
  assert.match(envExample, /EXPO_PUBLIC_SUPABASE_ANON_KEY/);
  assert.doesNotMatch(envExample, /SERVICE_ROLE|OPENAI_API_KEY|STRIPE_SECRET_KEY/);
});

test("mobile session uses SecureStore and AI uses server Bearer authentication", async () => {
  const secureStorage = await readFile(new URL("src/lib/secureStorage.ts", mobileRoot), "utf8");
  const api = await readFile(new URL("src/lib/api.ts", mobileRoot), "utf8");
  assert.match(secureStorage, /expo-secure-store/);
  assert.match(secureStorage, /WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
  assert.match(secureStorage, /CHUNK_SIZE/);
  assert.match(api, /Authorization: `Bearer \$\{input\.accessToken\}`/);
  assert.match(api, /\/api\/ai\/reply-suggestions/);
  assert.doesNotMatch(api, /OPENAI_API_KEY/);
});

test("no automatic sending is present in the mobile product", () => {
  const allSource = runtimeSource.map(({ content }) => content).join("\n");
  assert.match(allSource, /Keine automatische Sendefunktion/);
  assert.doesNotMatch(allSource, /sendMessage\(|\/send-message|automatisch senden/i);
});

test("mobile uses completed as canonical follow-up status and still hides legacy done rows", async () => {
  const data = await readFile(new URL("src/lib/data.ts", mobileRoot), "utf8");
  const statusPolicy = await readFile(
    new URL("src/lib/followupStatus.ts", mobileRoot),
    "utf8",
  );

  assert.match(statusPolicy, /CANONICAL_COMPLETED_FOLLOWUP_STATUS = "completed"/u);
  assert.match(statusPolicy, /LEGACY_COMPLETED_FOLLOWUP_STATUS = "done"/u);
  assert.match(data, /\.not\("status", "in", COMPLETED_FOLLOWUP_FILTER\)/u);
  assert.match(data, /update\(\{ status: CANONICAL_COMPLETED_FOLLOWUP_STATUS \}\)/u);
  assert.doesNotMatch(data, /\.neq\("status", "done"\)/u);
  assert.doesNotMatch(data, /update\(\{ status: "done" \}\)/u);
});

test("Mobile is an explicit active product stream in all central readers and the roadmap", async () => {
  const [readme, sourceOfTruth, agents, roadmap] = await Promise.all([
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/SOURCE_OF_TRUTH.md", import.meta.url), "utf8"),
    readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../src/config/roadmap.ts", import.meta.url), "utf8"),
  ]);

  assert.match(readme, /## Mobile-App/u);
  assert.match(readme, /signierte interne Builds und Store-Verteilung bleiben separat abzunehmen/u);
  assert.match(sourceOfTruth, /## 3\. Eigenständige Mobile-App/u);
  assert.match(sourceOfTruth, /kanonischen Status `completed`/u);
  assert.match(agents, /## Mobile product boundary/u);
  assert.match(agents, /canonical completed follow-up status is `completed`/u);
  assert.match(roadmap, /title: "Mobile-App für Android & iOS"/u);
  assert.match(roadmap, /Signierter interner Android-Build/u);
  assert.match(roadmap, /iOS-TestFlight/u);
});

test("Web and Mobile have separate compiler and CI boundaries", () => {
  assert.match(webTsconfig, /"apps\/mobile"/);
  assert.match(webEslint, /apps\/mobile\/\*\*/);
  assert.match(mobileCi, /FanMind Mobile CI/);
  assert.match(mobileCi, /working-directory: apps\/mobile/);
  assert.match(mobileCi, /Build Android JavaScript bundle/);
  assert.match(mobileReadme, /keine umverpackte Website/i);
  assert.match(mobileReadme, /eigene Releases/i);
});
