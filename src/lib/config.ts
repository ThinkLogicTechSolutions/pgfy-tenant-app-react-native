/** App runtime config resolved from the active environment (see app.config.ts). */
import Constants from 'expo-constants';

export type AppEnv = 'development' | 'staging' | 'production';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  appEnv?: AppEnv;
  apiUrl?: string;
};

const appEnv: AppEnv = extra.appEnv ?? 'development';

export const config = {
  appEnv,
  /** Base URL of the PGfy API for the active environment. */
  apiUrl: extra.apiUrl ?? 'http://10.0.2.2:4000/api',
  isDev: appEnv === 'development',
  isStaging: appEnv === 'staging',
  isProd: appEnv === 'production',
} as const;
