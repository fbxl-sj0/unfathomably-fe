const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { readdirSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const rootDir = resolve(__dirname, '..');
const localeDir = resolve(rootDir, 'src/locales');

const collectFiles = (directory) => {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
};

const hashFile = (path) => {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
};

const snapshotLocales = () => {
  return new Map(collectFiles(localeDir).map(path => [path, hashFile(path)]));
};

const sameSnapshot = (before, after) => {
  if (before.size !== after.size) {
    return false;
  }

  for (const [path, hash] of before) {
    if (after.get(path) !== hash) {
      return false;
    }
  }

  return true;
};

const before = snapshotLocales();
const result = process.platform === 'win32'
  ? spawnSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd run i18n'], { stdio: 'inherit' })
  : spawnSync('npm', ['run', 'i18n'], { stdio: 'inherit' });

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status || 1);
}

const after = snapshotLocales();

if (!sameSnapshot(before, after)) {
  process.stderr.write('Locale files are out of date. Please run `npm run i18n`.\n');
  process.exit(1);
}
