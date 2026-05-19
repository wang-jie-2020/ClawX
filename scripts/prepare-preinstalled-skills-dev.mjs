#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const lockPath = join(ROOT, 'build', 'preinstalled-skills', '.preinstalled-lock.json');
const bundleScript = join(ROOT, 'scripts', 'bundle-preinstalled-skills.mjs');

if (process.env.CLAWX_SKIP_PREINSTALLED_SKILLS_PREPARE === '1') {
  console.log('Skipping preinstalled skills prepare (CLAWX_SKIP_PREINSTALLED_SKILLS_PREPARE=1).');
  process.exit(0);
}

if (existsSync(lockPath)) {
  console.log('Preinstalled skills bundle already exists, skipping prepare.');
  process.exit(0);
}

console.log('Preinstalled skills bundle missing, preparing for dev startup...');

const runNodeScript = (scriptPath) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [scriptPath], {
    cwd: ROOT,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('error', (error) => {
    reject(error);
  });

  child.on('exit', (code, signal) => {
    if (code === 0) {
      resolve();
      return;
    }

    if (signal) {
      reject(new Error(`bundle process terminated by signal ${signal}`));
      return;
    }

    reject(new Error(`bundle process exited with code ${code}`));
  });
});

try {
  await runNodeScript(bundleScript);
} catch (error) {
  console.log(`Warning: failed to prepare preinstalled skills for dev startup: ${error?.message || error}`);
  process.exit(0);
}
