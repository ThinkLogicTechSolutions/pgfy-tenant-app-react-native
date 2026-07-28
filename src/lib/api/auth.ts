/**
 * Authentication endpoints (auth_api.md).
 *
 * All sit on the same Feathers `authenticate` service, discriminated by `strategy`
 * and HTTP verb:
 *   POST   /authenticate  strategy=phoneOtp  → send (or resend) the login OTP
 *   PATCH  /authenticate  strategy=phoneOtp  → verify the OTP, returns access_token + user
 *   POST   /authenticate  strategy=jwt       → refresh the session (bearer required)
 *   PATCH  /authenticate  strategy=jwt, action=logout → invalidate the session (bearer required)
 */
import { request } from './client';
import type { AuthResponse, GuestAuthResponse } from './types';
import { DEVICE_TYPE, getDeviceId } from '../device';
import { getFcmToken } from '../messaging';

/** This app authenticates tenants only. */
const ENTITY = 'TENANT';
const DEFAULT_COUNTRY_CODE = '91';

export interface SendOtpInput {
  /** 10-digit national number, digits only. */
  phone: string;
  countryCode?: string;
}

/** Send — or resend — the login OTP. Same endpoint serves both. */
export async function sendPhoneOtp({ phone, countryCode = DEFAULT_COUNTRY_CODE }: SendOtpInput): Promise<{ message: string }> {
  const deviceId = await getDeviceId();
  return request<{ message: string }>('/authenticate', {
    method: 'POST',
    auth: false,
    body: {
      strategy: 'phoneOtp',
      purpose: 'login',
      entity: ENTITY,
      phone,
      countryCode,
      deviceId,
      deviceType: DEVICE_TYPE,
    },
  });
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
  countryCode?: string;
  /** Only meaningful on first login, where the backend creates the profile. */
  name?: string;
}

/** Verify the OTP and open a session. */
export async function verifyPhoneOtp({
  phone,
  otp,
  countryCode = DEFAULT_COUNTRY_CODE,
  name,
}: VerifyOtpInput): Promise<AuthResponse> {
  const [deviceId, fcmId] = await Promise.all([getDeviceId(), getFcmToken()]);
  return request<AuthResponse>('/authenticate', {
    method: 'PATCH',
    auth: false,
    body: {
      strategy: 'phoneOtp',
      purpose: 'login',
      entity: ENTITY,
      phone,
      countryCode,
      otp,
      deviceId,
      deviceType: DEVICE_TYPE,
      ...(name ? { name } : {}),
      ...(fcmId ? { fcmId } : {}),
    },
  });
}

/** Open a guest session — no phone/OTP, no tenant profile, browse-only access. */
export async function guestLogin(): Promise<GuestAuthResponse> {
  const deviceId = await getDeviceId();
  return request<GuestAuthResponse>('/authenticate', {
    method: 'POST',
    auth: false,
    body: {
      strategy: 'guestlogin',
      entity: 'GUEST',
      deviceId,
      deviceType: DEVICE_TYPE,
      fcmId: '',
    },
  });
}

/** Exchange the current bearer token for a fresh one and re-read the user (reopen-app). */
export async function refreshSession(): Promise<AuthResponse> {
  const deviceId = await getDeviceId();
  return request<AuthResponse>('/authenticate', {
    method: 'POST',
    body: {
      strategy: 'jwt',
      deviceId,
      deviceType: DEVICE_TYPE,
    },
  });
}

/**
 * Invalidate the session server-side. A 401 here just means the token was already dead,
 * so we don't let it trigger the global sign-out handler — the caller is signing out anyway.
 */
export async function logout(): Promise<void> {
  const deviceId = await getDeviceId();
  await request<unknown>('/authenticate', {
    method: 'PATCH',
    ignoreUnauthorized: true,
    body: {
      strategy: 'jwt',
      deviceId,
      deviceType: DEVICE_TYPE,
      action: 'logout',
    },
  });
}

// ---------------------------------------------------------------------------
// Contact-change verification (auth_api.md — phone/email update)
//
// Editing the signed-in tenant's phone or email is OTP-gated: the same `authenticate`
// service sends (POST) and verifies (PATCH) an OTP, discriminated by `strategy`
// (phoneOtp / emailOtp). These calls run *authenticated* (`entity: USER`, `purpose:
// verification`) — unlike login, which is public. On a verified OTP the backend applies
// the new contact to the profile *and* mints a fresh access token (the old one may no
// longer be valid), so callers must adopt the returned `token` before refreshing.
// ---------------------------------------------------------------------------

const VERIFICATION_ENTITY = 'TENANT';
const VERIFICATION_PURPOSE = 'verification';

export interface SendPhoneVerificationInput {
  /** The new 10-digit national number to verify, digits only. */
  phone: string;
  countryCode?: string;
}

/** Send an OTP to a new phone number the user wants to move their account to. */
export async function sendPhoneVerificationOtp({
  phone,
  countryCode = DEFAULT_COUNTRY_CODE,
}: SendPhoneVerificationInput): Promise<{ message?: string }> {
  const deviceId = await getDeviceId();
  return request<{ message?: string }>('/authenticate', {
    method: 'POST',
    body: {
      strategy: 'phoneOtp',
      entity: VERIFICATION_ENTITY,
      purpose: VERIFICATION_PURPOSE,
      countryCode,
      phone,
      deviceId,
      deviceType: DEVICE_TYPE,
    },
  });
}

export interface VerifyPhoneVerificationInput extends SendPhoneVerificationInput {
  otp: string;
}

/** A verified contact change mints a fresh access token — the caller must adopt it. */
export interface VerifyContactResponse {
  token: string;
  message?: string;
}

/** Verify the OTP for a phone change; on success the backend updates the profile's phone. */
export async function verifyPhoneVerificationOtp({
  phone,
  otp,
  countryCode = DEFAULT_COUNTRY_CODE,
}: VerifyPhoneVerificationInput): Promise<VerifyContactResponse> {
  const deviceId = await getDeviceId();
  return request<VerifyContactResponse>('/authenticate', {
    method: 'PATCH',
    body: {
      strategy: 'phoneOtp',
      entity: VERIFICATION_ENTITY,
      purpose: VERIFICATION_PURPOSE,
      countryCode,
      phone,
      otp,
      deviceId,
    },
  });
}

export interface SendEmailVerificationInput {
  email: string;
}

/** Send an OTP to a new email address the user wants to attach to their account. */
export async function sendEmailVerificationOtp({ email }: SendEmailVerificationInput): Promise<{ message?: string }> {
  const deviceId = await getDeviceId();
  return request<{ message?: string }>('/authenticate', {
    method: 'POST',
    body: {
      strategy: 'emailOtp',
      entity: VERIFICATION_ENTITY,
      purpose: VERIFICATION_PURPOSE,
      email,
      deviceId,
      deviceType: DEVICE_TYPE,
    },
  });
}

export interface VerifyEmailVerificationInput extends SendEmailVerificationInput {
  otp: string;
}

/** Verify the OTP for an email change; on success the backend updates the profile's email. */
export async function verifyEmailVerificationOtp({ email, otp }: VerifyEmailVerificationInput): Promise<VerifyContactResponse> {
  const deviceId = await getDeviceId();
  return request<VerifyContactResponse>('/authenticate', {
    method: 'PATCH',
    body: {
      strategy: 'emailOtp',
      entity: VERIFICATION_ENTITY,
      purpose: VERIFICATION_PURPOSE,
      email,
      otp,
      deviceId,
    },
  });
}

// ---------------------------------------------------------------------------
// Company email verification (occupation details — working professional)
//
// Same `authenticate`/emailOtp strategy as contact-change verification, but discriminated
// by `purpose: verify_company_email` and `entity: TENANT`. Verifying doesn't rotate the
// access token — it just flips `occupation_details.company_email_verified` server-side, so
// callers should refresh the profile afterwards to pick that up.
// ---------------------------------------------------------------------------

const COMPANY_EMAIL_PURPOSE = 'verify_company_email';

export interface SendCompanyEmailOtpInput {
  email: string;
}

/** Send an OTP to the company email entered in occupation details. */
export async function sendCompanyEmailOtp({ email }: SendCompanyEmailOtpInput): Promise<{ message?: string }> {
  const deviceId = await getDeviceId();
  return request<{ message?: string }>('/authenticate', {
    method: 'POST',
    body: {
      strategy: 'emailOtp',
      entity: ENTITY,
      purpose: COMPANY_EMAIL_PURPOSE,
      email,
      deviceId,
      deviceType: DEVICE_TYPE,
    },
  });
}

export interface VerifyCompanyEmailOtpInput extends SendCompanyEmailOtpInput {
  otp: string;
}

/** Verify the company email OTP. */
export async function verifyCompanyEmailOtp({ email, otp }: VerifyCompanyEmailOtpInput): Promise<{ message?: string }> {
  const deviceId = await getDeviceId();
  return request<{ message?: string }>('/authenticate', {
    method: 'PATCH',
    body: {
      strategy: 'emailOtp',
      entity: ENTITY,
      purpose: COMPANY_EMAIL_PURPOSE,
      email,
      otp,
      deviceId,
    },
  });
}
