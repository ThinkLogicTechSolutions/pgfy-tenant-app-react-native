/**
 * SnapKYC session endpoint.
 *
 * Aadhaar KYC runs out-of-app: we POST for a session, the server returns an `intent_url` that
 * opens the official Aadhaar app, and the *result* arrives over the realtime socket
 * (`v1/profile-kyc created`) rather than in an HTTP response. See `SnapKycSheet` for the
 * launch-and-listen flow that ties this together.
 */
import { request } from './client';

/** Native app KYC always uses the Aadhaar-app deep link (`INTENT`); web uses `QR`. */
export type SnapKycFlow = 'INTENT' | 'QR';
export type SnapKycPlatform = 'android' | 'ios' | 'web';

export interface CreateSnapKycSessionInput {
  platform: SnapKycPlatform;
  flow: SnapKycFlow;
  /** Every tenant-app session verifies the signed-in tenant's own identity. */
  type: 'TENANT';
}

export interface SnapKycSession {
  /** Correlates the socket `patched` event back to this launch. */
  txn_id: string;
  platform: SnapKycPlatform;
  /** `intent:…` URL that launches the official Aadhaar app to complete verification. */
  intent_url: string;
}

/** Open a SnapKYC session and get the Aadhaar-app intent URL to launch. */
export async function createSession(input: CreateSnapKycSessionInput): Promise<SnapKycSession> {
  return request<SnapKycSession>('/snapkyc-session', { method: 'POST', body: input });
}
