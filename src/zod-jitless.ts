import { config } from 'zod/v4/core';

/*
  Zod normally probes whether Function() is available so it can JIT a faster
  object parser.  Strict production CSPs report that probe as an eval violation
  even when Zod catches the exception.  The app does not need that JIT path, so
  keep schema parsing on the CSP-safe interpreter path.
*/
config({ jitless: true });

