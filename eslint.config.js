import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import jsdocPlugin from 'eslint-plugin-jsdoc';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const legacyConfig = require('./.eslintrc.json');
const compatLegacyConfig = {
  ...legacyConfig,
  plugins: legacyConfig.plugins?.filter((plugin) => plugin !== 'jsdoc'),
};
const baseDirectory = path.dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const unwrapDefaultPlugins = (config) => {
  if (!config.plugins) {
    return config;
  }

  return {
    ...config,
    plugins: Object.fromEntries(
      Object.entries(config.plugins).map(([name, plugin]) => [
        name,
        plugin?.default ?? plugin,
      ]),
    ),
  };
};

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'eslint.config.js',
      '**/*.css',
      'static/**',
      'public/**',
      'tmp/**',
      'coverage/**',
      'custom/**',
    ],
  },
  {
    plugins: {
      jsdoc: jsdocPlugin,
    },
  },
  ...compat.config(compatLegacyConfig).map(unwrapDefaultPlugins),
];
