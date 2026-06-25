import { describe, expect, it } from 'vitest';

import { isDynamicImportError } from './site-error-boundary.tsx';

describe('isDynamicImportError', () => {
  it('detects browser chunk loading failures', () => {
    expect(isDynamicImportError(new TypeError('Failed to fetch dynamically imported module: https://example.test/packs/js/compose-modal.js'))).toBe(true);
    expect(isDynamicImportError(new Error('error loading dynamically imported module'))).toBe(true);
    expect(isDynamicImportError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isDynamicImportError(new Error('ChunkLoadError: Loading chunk 10 failed.'))).toBe(true);
  });

  it('leaves ordinary application errors alone', () => {
    expect(isDynamicImportError(new Error('Something went wrong.'))).toBe(false);
  });
});
