#!/usr/bin/env node

import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const workflowRoot = '.github/workflows';
const temporaryWorkflow = 'p1-supply-chain-hardening-patch-20260723.yml';
const obsoleteWorkflow = 'one-off-apply-top-fan-migration-20260719.yml';
const pins = new Map([
  ['actions/checkout@v4', 'actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4'],
  ['actions/setup-node@v4', 'actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4'],
  ['actions/upload-artifact@v4', 'actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4'],
]);

async function pinWorkflow(name) {
  if (name === temporaryWorkflow || name === obsoleteWorkflow) return;
  const path = join(workflowRoot, name);
  let source = await readFile(path, 'utf8');
  for (const [mutable, pinned] of pins) {
    source = source.replaceAll(mutable, pinned);
  }
  if (name === 'deploy-fanmind.yml' && !/^permissions\s*:/mu.test(source)) {
    const anchor = `concurrency:\n  group: fanmind-production-deploy\n  cancel-in-progress: false\n\n`;
    if (!source.includes(anchor)) throw new Error('deploy_permissions_anchor_missing');
    source = source.replace(
      anchor,
      `${anchor}permissions:\n  contents: read\n\n`,
    );
  }
  await writeFile(path, source, 'utf8');
}

async function updatePackageManifest() {
  const path = 'package.json';
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifest.dependencies.next = '16.2.11';
  manifest.devDependencies['eslint-config-next'] = '16.2.11';
  await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}

async function main() {
  const workflows = (await readdir(workflowRoot))
    .filter(name => /\.ya?ml$/iu.test(name))
    .sort();
  for (const workflow of workflows) await pinWorkflow(workflow);
  await rm(join(workflowRoot, obsoleteWorkflow), { force: true });
  await updatePackageManifest();
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : 'supply_chain_patch_failed'}\n`);
  process.exit(1);
});
