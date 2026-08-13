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
  /** Base URL for outgoing share links (property, referral, ...) — `share.pgfy.in` in
   * production, `share-dev.pgfy.in` everywhere else. Both hosts are registered as Universal
   * Links / App Links in `app.json` (`ios.associatedDomains` / `android.intentFilters`), so
   * the app opens links from either domain regardless of which env generated them — this
   * only controls which one a fresh share link is *built* with. */
  shareBaseUrl: appEnv === 'production' ? 'https://share.pgfy.in' : 'https://share-dev.pgfy.in',
  isDev: appEnv === 'development',
  isStaging: appEnv === 'staging',
  isProd: appEnv === 'production',
} as const;
