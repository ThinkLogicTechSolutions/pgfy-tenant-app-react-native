/**
 * Thin axios wrapper for the PGfy API.
 *
 * Responsibilities: resolve the versioned base URL, attach the bearer token, enforce a
 * request timeout, and normalise every failure into an `ApiError` so screens can render
 * `err.message` directly. The access token is held in memory (hydrated from AsyncStorage
 * once at boot by AuthContext) so no request has to await storage.
 */
import axios, { type AxiosError } from 'axios';
import { config } from '../config';

/** The doc's `{{baseUrlV1}}`: append `/v1` to the environment's API root. */
export const API_BASE_URL = `${config.apiUrl.replace(/\/+$/, '')}/v1`;

const DEFAULT_TIMEOUT_MS = 20_000;

/** Status used when the request never reached the server (offline, DNS, timeout). */
export const NETWORK_ERROR_STATUS = 0;

export class ApiError extends Error {
  readonly status: number;
  /** Feathers `className`, e.g. `not-authenticated`, `bad-request`. */
  readonly code?: string;
  readonly data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }

  /** Request never reached the server — callers may keep local state rather than sign out. */
  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

// ---------------------------------------------------------------------------
// Access token (in-memory; AuthContext owns persistence)
// ---------------------------------------------------------------------------

let accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ---------------------------------------------------------------------------
// 401 handling
// ---------------------------------------------------------------------------

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** AuthContext registers a handler here so an expired token signs the user out app-wide. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

// ---------------------------------------------------------------------------
// axios instance
// ---------------------------------------------------------------------------

/**
 * `validateStatus` always passes so axios never rejects on a 4xx/5xx — every HTTP response
 * (success or error) flows through the same success path below, matching `fetch`'s behaviour
 * of only throwing when the request never reaches the server.
 */
const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  validateStatus: () => true,
  transformResponse: [
    (data: unknown) => {
      if (typeof data !== 'string') return data;
      if (!data) return null;
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    },
  ],
});

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Attach the bearer token. Default true; auth endpoints pass false. */
  auth?: boolean;
  /** Suppress the global sign-out on 401 (used by `logout`, whose token may already be dead). */
  ignoreUnauthorized?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
}

function buildPath(path: string, query?: Record<string, QueryValue>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!query) return normalized;
  const params = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return params.length ? `${normalized}?${params.join('&')}` : normalized;
}

/** Pull the most useful message out of a Feathers error body. */
function messageFromBody(body: unknown, status: number): { message: string; code?: string } {
  if (body && typeof body === 'object') {
    const b = body as { message?: unknown; className?: unknown; name?: unknown };
    if (typeof b.message === 'string' && b.message.trim()) {
      return {
        message: b.message,
        code: typeof b.className === 'string' ? b.className : typeof b.name === 'string' ? b.name : undefined,
      };
    }
  }
  if (status === 401) return { message: 'Your session has expired. Please sign in again.' };
  if (status === 403) return { message: "You don't have permission to do that." };
  if (status === 404) return { message: 'Not found.' };
  if (status >= 500) return { message: 'The server is having trouble. Please try again shortly.' };
  return { message: `Request failed (${status}).` };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    auth = true,
    ignoreUnauthorized = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
  } = options;

  // Multipart uploads pass a FormData body: leave it untouched and let axios/XHR set the
  // `multipart/form-data` boundary itself — forcing a JSON content-type would corrupt it.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;

  let status: number;
  let payload: unknown;
  try {
    // Serialisation is left to axios's default transformRequest: it JSON-encodes plain objects
    // exactly once and sets the JSON content-type in-band while doing so. Overriding it detaches
    // that mechanism and axios then falls back to x-www-form-urlencoded on POST/PATCH, which
    // Feathers reads as an empty body ("platform is required"). Bodiless requests (GETs, logout)
    // must pass `undefined` — anything else (even null) gets JSON-encoded into a literal body,
    // and axios's XHR adapter intentionally drops Content-Type when there is no body.
    const response = await http.request({
      url: buildPath(path, query),
      method,
      headers,
      data: body,
      timeout: timeoutMs,
      signal,
    });
    status = response.status;
    payload = response.data;
  } catch (e) {
    const err = e as AxiosError;
    const aborted = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || axios.isCancel(e);
    throw new ApiError(
      aborted
        ? 'The request timed out. Please check your connection and try again.'
        : 'Unable to reach PGfy. Please check your connection and try again.',
      NETWORK_ERROR_STATUS,
      aborted ? 'timeout' : 'network-error',
    );
  }

  if (status < 200 || status >= 300) {
    const { message, code } = messageFromBody(payload, status);
    if (status === 401 && !ignoreUnauthorized) unauthorizedHandler?.();
    throw new ApiError(message, status, code, payload);
  }

  return payload as T;
}

/** Human-readable message for any thrown value — safe to drop straight into an Alert. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
