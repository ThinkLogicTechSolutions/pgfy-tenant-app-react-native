/** "Invite a PG" submissions raised by the tenant (Home → Quick actions → Invite a PG).
 *  Tiny cross-screen store (mirrors the other lightweight stores). In a real build these
 *  POST to the API and surface in the admin panel under Properties → Property Leads;
 *  here they persist for the session. */
import { useEffect, useReducer } from 'react';
import type { PgType } from '@/data/propertyInvite';

export interface PropertyInvite {
  id: string;
  pgName: string;
  propertyType: PgType;
  state: string;
  city: string;
  locality: string;
  address: string;
  ownerName: string;
  contactNumber: string;
  images: string[];
  status: 'Submitted';
  createdAt: string;
}

export type PropertyInviteInput = Omit<PropertyInvite, 'id' | 'status' | 'createdAt'>;

const invites: PropertyInvite[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function usePropertyInvites() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return {
    list: () => invites,
    count: invites.length,
    add: (input: PropertyInviteInput): PropertyInvite => {
      const invite: PropertyInvite = {
        ...input,
        id: `pinv-${Date.now()}`,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      };
      invites.unshift(invite);
      emit();
      return invite;
    },
  };
}
