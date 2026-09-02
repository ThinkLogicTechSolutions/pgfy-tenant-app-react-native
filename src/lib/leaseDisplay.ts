/** Display helpers for lease agreements — status label/tone + safe `lease_signing_urls` reads. */
import type { Tone } from '@/components/ui';
import type { LeaseAgreementStatus } from '@/lib/api';
import { titleCaseFromSnake } from '@/lib/format';

const LABELS: Record<string, string> = {
  PENDING_TENANT: 'Pending your signature',
  SIGNED: 'Signed & active',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

export function leaseStatusLabel(status: LeaseAgreementStatus): string {
  return LABELS[status] ?? titleCaseFromSnake(status);
}

const TONES: Record<string, Tone> = {
  PENDING_TENANT: 'warning',
  SIGNED: 'success',
  CANCELLED: 'neutral',
  EXPIRED: 'danger',
};

export function leaseStatusTone(status: LeaseAgreementStatus): Tone {
  return TONES[status] ?? 'neutral';
}

/** `lease_signing_urls` shape varies by e-sign provider — a bare string, or an object keyed
 * by party (e.g. `{ tenant: '...', owner: '...' }`). Read defensively for whichever it is. */
export function leaseSigningUrl(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const candidate = obj.tenant ?? obj.signing_url ?? Object.values(obj)[0];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return null;
}
