import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';

const normalizePath = (filePath?: string | null, baseDir?: string) => {
  if (!filePath) return undefined;
  if (path.isAbsolute(filePath)) return filePath;
  const resolvedBase = baseDir ?? process.cwd();
  return path.resolve(resolvedBase, filePath);
};

const rootHints = Array.from(
  new Set(
    [
      process.cwd(),
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '..', '..'),
      path.resolve(__dirname, '..', '..', '..'),
      process.env.PROJECT_ROOT,
    ].filter(Boolean),
  ),
);

const envNames = [process.env.ENV_FILE, process.env.BACKEND_ENV_FILE, '.env', '.env.local', '.env.development'].filter(Boolean) as string[];

const candidates = rootHints
  .flatMap((root) => envNames.map((name) => normalizePath(name, root)))
  .filter(Boolean) as string[];

const loaded = new Set<string>();
const loadedLabels: string[] = [];

for (const filePath of candidates) {
  if (!fs.existsSync(filePath)) continue;
  const key = path.resolve(filePath);
  if (loaded.has(key)) continue;
  const result = config({ path: filePath });
  if (result.error) {
    console.warn(`[env] Failed to load ${filePath}: ${result.error.message}`);
  } else {
    loaded.add(key);
    loadedLabels.push(path.basename(filePath));
  }
}

if (loadedLabels.length) {
  console.info(`[env] Loaded environment files: ${loadedLabels.join(', ')}`);
} else {
  console.warn('[env] No environment file was loaded. Falling back to process environment.');
}

if (!process.env.DATABASE_URL) {
  console.warn('[env] DATABASE_URL is not set. Ensure your .env or .env.development file provides a Postgres connection string.');
}
