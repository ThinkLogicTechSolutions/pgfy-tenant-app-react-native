/** Group booking enquiries submitted by the tenant (bulk / team stays).
 *  Tiny cross-screen store (mirrors the other lightweight stores). In a real build these
 *  POST to the API and surface in the admin panel; here they persist for the session. */
import { useEffect, useReducer } from 'react';

export type GroupPreference = 'Male only' | 'Female only' | 'Co-live';
export type GroupFoodType = 'Vegetarian' | 'Non-vegetarian';

export interface GroupBookingEnquiry {
  id: string;
  contactName: string;
  contactPhone: string;
  checkIn: string;
  checkOut: string;
  bedsRequired: number;
  maleCount: number;
  femaleCount: number;
  preference: GroupPreference;
  mealsPerDay: 2 | 3;
  foodType: GroupFoodType;
  city: string;
  location: string;
  organization: string;
  status: 'Submitted';
  createdAt: string;
}

export type GroupBookingInput = Omit<GroupBookingEnquiry, 'id' | 'status' | 'createdAt'>;

const enquiries: GroupBookingEnquiry[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function useGroupBookings() {
  const [, force] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);
  return {
    list: () => enquiries,
    count: enquiries.length,
    add: (input: GroupBookingInput): GroupBookingEnquiry => {
      const enquiry: GroupBookingEnquiry = {
        ...input,
        id: `gb-${Date.now()}`,
        status: 'Submitted',
        createdAt: new Date().toISOString(),
      };
      enquiries.unshift(enquiry);
      emit();
      return enquiry;
    },
  };
}
