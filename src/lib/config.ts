/** App runtime config resolved from the active environment (see app.config.ts). */
import Constants from 'expo-constants';

export type AppEnv = 'development' | 'staging' | 'production';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  appEnv?: AppEnv;
  apiUrl?: string;
  googleMapsApiKey?: string;
};

const appEnv: AppEnv = extra.appEnv ?? 'development';

export const config = {
  appEnv,
  /** Base URL of the PGfy API for the active environment (no trailing `/v1`). */
  apiUrl: extra.apiUrl ?? 'https://api-dev.pgfy.in',
  /** Google Geocoding / Places API key, used for the location-permission and search-autocomplete flows. */
  googleMapsApiKey: extra.googleMapsApiKey ?? '',
  isDev: appEnv === 'development',
  isStaging: appEnv === 'staging',
  isProd: appEnv === 'production',
} as const;
