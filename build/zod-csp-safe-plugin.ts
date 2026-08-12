/*
 * Unfathomably FE
 * ----------------
 *
 * File: build/zod-csp-safe-plugin.ts
 *
 * Purpose:
 *
 *   Keep Zod schema validation compatible with a strict Content Security
 *   Policy without granting JavaScript string-evaluation permission.
 *
 * Responsibilities:
 *
 *   - identify every bundled Zod v4 core utility module
 *   - disable Zod's optional Function-constructor JIT capability probe
 *   - fail the build if a recognizable probe changes into an unsafe form
 *
 * This file intentionally does NOT contain:
 *
 *   - application validation rules
 *   - runtime Content Security Policy configuration
 *   - general-purpose dependency source rewriting
 */

import type { Plugin } from 'vite';

const ZOD_CORE_UTIL_PATH = /\/zod\/v4\/core\/util\.(?:cjs|js|mjs|ts)$/;
const ZOD_EVAL_PROBE = /(?:\/\/\s*@ts-ignore\s*)?const F = Function;\s*new F\(""\);\s*return true;/;
const DYNAMIC_CODE_CONSTRUCTION = /\b(?:eval|Function)\s*\(|\bnew\s+(?:F|Function)\s*\(/;

/**
 * Disable Zod's optional object-parser JIT for all dependency copies.
 *
 * Zod catches a blocked Function constructor and falls back correctly, but
 * browsers still report the attempted evaluation as a CSP violation. Runtime
 * configuration is not sufficient when another dependency embeds its own Zod
 * copy, so the production build removes the capability probe at its source.
 */
const zodCspSafePlugin = (): Plugin => ({
  name: 'unfathomably-zod-csp-safe',
  enforce: 'pre',
  transform(code, id) {
    const modulePath = id.split('?', 1)[0].replaceAll('\\', '/');

    if (!ZOD_CORE_UTIL_PATH.test(modulePath)) {
      return null;
    }

    const transformedCode = code.replace(
      ZOD_EVAL_PROBE,
      'return false;',
    );

    if (transformedCode !== code) {
      return {
        code: transformedCode,
        map: null,
      };
    }

    if (DYNAMIC_CODE_CONSTRUCTION.test(code)) {
      this.error(`Unrecognized dynamic-code probe in ${modulePath}`);
    }

    return null;
  },
});

export { zodCspSafePlugin };

/* end of build/zod-csp-safe-plugin.ts */
