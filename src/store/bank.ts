/** Tenant refund bank account — in-memory store for mockup. */
import { useEffect, useReducer } from 'react';

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
}

const empty: BankDetails = {
  accountHolderName: '',
  accountNumber: '',
  ifsc: '',
};

let details: BankDetails = { ...empty };
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getBankDetails(): BankDetails {
  return details;
}

export function setBankDetails(next: BankDetails) {
  details = {
    accountHolderName: next.accountHolderName.trim(),
    accountNumber: next.accountNumber.replace(/\s/g, ''),
    ifsc: next.ifsc.trim().toUpperCase(),
  };
  emit();
}

export function clearBankDetails() {
  details = { ...empty };
  emit();
}

export function isBankDetailsComplete(d: BankDetails = details): boolean {
  return (
    d.accountHolderName.trim().length > 0
    && d.accountNumber.replace(/\s/g, '').length >= 9
    && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(d.ifsc.trim().toUpperCase())
  );
}

export function bankDetailsSummary(d: BankDetails = details): string | null {
  if (!isBankDetailsComplete(d)) return null;
  const acct = d.accountNumber.replace(/\s/g, '');
  const masked = acct.length > 4 ? `····${acct.slice(-4)}` : acct;
  return `${d.accountHolderName} · ${masked} · ${d.ifsc.toUpperCase()}`;
}

export function useBank() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => {
      listeners.delete(force);
    };
  }, []);
  return {
    details,
    isComplete: isBankDetailsComplete(details),
    summary: bankDetailsSummary(details),
    set: setBankDetails,
    clear: clearBankDetails,
  };
}
