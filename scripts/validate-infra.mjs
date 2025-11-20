#!/usr/bin/env node
/* eslint-env node */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const steps = [
  {
    label: 'docker compose config (dev stack)',
    command: 'docker',
    args: ['compose', '-f', 'docker-compose.dev.yml', 'config'],
    optional: false,
  },
  {
    label: 'kubectl dry-run apply (production deployment)',
    command: 'kubectl',
    args: ['apply', '--dry-run=client', '--validate=true', '-f', 'k8s/production/deployment.yaml'],
    optional: true,
  },
];

for (const step of steps) {
  process.stdout.write(`\n[infra] ${step.label}\n`);
  const result = spawnSync(step.command, step.args, { stdio: 'inherit' });
  if (result.error) {
    if (step.optional) {
      process.stdout.write(`[infra] Skipping optional step (${step.label}): ${result.error.message}\n`);
      continue;
    }
    throw result.error;
  }
  if ((result.status ?? 0) !== 0) {
    if (step.optional) {
      process.stdout.write(`[infra] Optional step failed (${step.label}) with code ${result.status}; continuing.\n`);
      continue;
    }
    process.exit(result.status ?? 1);
  }
}

process.stdout.write('\n[infra] Validation complete.\n');
