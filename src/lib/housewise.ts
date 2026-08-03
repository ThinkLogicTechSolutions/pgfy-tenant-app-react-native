/** HouseWise maintenance-partner integration (M-INT1) — tenant side.
 *  When a tenant raises a property complaint for a PG that the owner has
 *  enrolled in HouseWise, the complaint is auto-created in HouseWise (simulated
 *  here — no real backend). Servicing happens on HouseWise; the property
 *  manager closes the complaint back in PGfy. */
import type { HouseWiseTicketLink } from '@/data/types';

export const HOUSEWISE_DASHBOARD_BASE = 'https://app.housewise.in';

/** Listings whose owner has opted this PG into HouseWise. The demo active
 *  booking (l1) is enrolled so the create→sync flow is demonstrable. */
const HOUSEWISE_ENABLED_LISTINGS = new Set<string>(['l1']);

export function isHouseWiseEnabled(listingId: string | undefined): boolean {
  return !!listingId && HOUSEWISE_ENABLED_LISTINGS.has(listingId);
}

/** Simulate the HouseWise "create complaint" API call — returns the mirror link. */
export function createHouseWiseComplaint(ticketId: string): HouseWiseTicketLink {
  const digits = ticketId.replace(/\D/g, '').slice(-5) || `${Math.floor(10000 + Math.random() * 89999)}`;
  const complaintId = `HW-${digits}`;
  return {
    complaintId,
    url: `${HOUSEWISE_DASHBOARD_BASE}/complaints/${complaintId}`,
    syncedAt: new Date().toISOString(),
    status: 'synced',
  };
}
