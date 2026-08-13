import { ExpoConfig, ConfigContext } from 'expo/config';
import { config as loadEnv } from 'dotenv';
import path from 'path';

type AppEnv = 'development' | 'staging' | 'production';

const APP_ENV = (process.env.APP_ENV as AppEnv) || 'development';

// Load the env file for the selected APP_ENV with override:true so it wins over any
// `.env`/`.env.<NODE_ENV>` Expo already loaded into process.env before this config runs.
loadEnv({ path: path.resolve(__dirname, `.env.${APP_ENV}`), override: true });
loadEnv({ path: path.resolve(__dirname, '.env') });

// Per-environment defaults used when the matching `.env.<APP_ENV>` value is absent.
const DEFAULTS: Record<AppEnv, { name: string; apiUrl: string }> = {
  development: { name: 'PGfy (Dev)', apiUrl: 'https://api-dev.pgfy.in' },
  staging: { name: 'PGfy (Staging)', apiUrl: 'https://staging-api.pgfy.app' },
  production: { name: 'PGfy', apiUrl: 'https://api.pgfy.app' },
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const defaults = DEFAULTS[APP_ENV];
  const apiUrl = process.env.API_URL || defaults.apiUrl;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  const projectId = config.extra?.eas?.projectId as string | undefined;

  return {
    ...config,
    name: defaults.name,
    slug: config.slug ?? 'pgfy-tenant',
    // Runtime version *policies* (e.g. `{ policy: 'appVersion' }`) only work in the managed
    // workflow — this project has committed native `ios`/`android` projects (bare workflow),
    // where EAS requires an explicit string instead. Tying it to `config.version` keeps the
    // same "bump together" behavior the policy was going for.
    runtimeVersion: config.version ?? '1.0.0',
    updates: {
      url: `https://u.expo.dev/${projectId}`,
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...config.extra,
      appEnv: APP_ENV,
      apiUrl,
      googleMapsApiKey,
    },
  };
};
