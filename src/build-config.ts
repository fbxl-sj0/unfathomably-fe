import { env, type SoapboxEnv } from './build-config.compile.ts';

export type { SoapboxEnv };

export const {
  NODE_ENV,
  BACKEND_URL,
  FE_INSTANCE_SOURCE_DIR,
  SENTRY_DSN,
} = env;
