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
      'dist-*/**',
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
  {
    files: [
      'src/features/native-federation/**/*.{ts,tsx}',
      'src/components/book-shelf-control.tsx',
      'src/components/chess-position.tsx',
      'src/components/native-object-state-control.tsx',
      'src/components/native-status-context.tsx',
      'src/features/federation/native-source-item-card.tsx',
    ],
    rules: {
      // Native federation is a new English-only presentation surface. Keep
      // the localization rule enabled everywhere else until its catalog is
      // extracted as one coherent translation change.
      'formatjs/no-literal-string-in-jsx': 'off',
    },
  },
  {
    files: [
      'src/api/hooks/discovery/useNativeCommunityCatalog.ts',
      'src/api/hooks/discovery/usePublishingDiscovery.ts',
      'src/components/native-status-context.tsx',
      'src/features/native-federation/**/*.{ts,tsx}',
    ],
    rules: {
      // These bounded response normalizers deliberately select the first
      // usable shape from several federated wire representations.
      'no-nested-ternary': 'off',
    },
  },
  {
    files: [
      'src/components/book-shelf-control.tsx',
      'src/components/native-object-state-control.tsx',
    ],
    rules: {
      // Selecting an object state persists it immediately. Delaying that
      // action until blur would make keyboard and pointer interactions diverge.
      'jsx-a11y/no-onchange': 'off',
    },
  },
  {
    files: ['src/features/native-federation/native-discovery-article.tsx'],
    rules: {
      // The status request is handled by the Redux thunk error boundary.
      'promise/catch-or-return': 'off',
    },
  },
  {
    files: ['src/features/native-federation/worlds-workflow-hub.tsx'],
    rules: {
      // The resolved workflow is intentionally retained for the selected
      // route while its navigation configuration is derived separately.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
