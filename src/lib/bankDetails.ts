/** Helpers over the API's tenant `bank_details` (deposit-refund account). */
import type { BankDetails } from '@/lib/api';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export function isBankDetailsComplete(d: BankDetails | null | undefined): boolean {
  if (!d) return false;
  const acct = (d.account_number ?? '').replace(/\s/g, '');
  const ifsc = (d.ifsc_code ?? '').trim().toUpperCase();
  return !!(d.account_holder_name ?? '').trim() && acct.length >= 9 && IFSC_RE.test(ifsc);
}

export function bankDetailsSummary(d: BankDetails | null | undefined): string | null {
  if (!isBankDetailsComplete(d)) return null;
  const acct = (d!.account_number ?? '').replace(/\s/g, '');
  const masked = acct.length > 4 ? `····${acct.slice(-4)}` : acct;
  return `${d!.account_holder_name} · ${masked} · ${d!.ifsc_code?.toUpperCase()}`;
}
