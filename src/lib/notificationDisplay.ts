/** Where a notification's `action` (+ `entity_id`/`target_location`) should navigate to. */
import type { ApiTenantNotification } from '@/lib/api';

export type NotificationRoute = string | { pathname: string; params?: Record<string, string> };

/** "/home" (the backend's generic name for the tenant's landing screen) → this app's actual
 * route for it. Anything else is passed through as-is — a best-effort attempt for whatever
 * path the backend sends, since we can't enumerate every value it might use. */
function normalizeTargetLocation(target: string | null | undefined): NotificationRoute | null {
  if (!target) return null;
  if (target === '/home') return '/(tabs)';
  return target;
}

/** Resolves a notification to an in-app route. Most actions map to a fixed screen (optionally
 * parameterized by `entity_id`); `BROADCAST` isn't tied to any one entity type/id, so it
 * defers entirely to the backend-provided `target_location` instead. Returns `null` when
 * there's nowhere in this (tenant) app for the notification to go — e.g. owner-only actions. */
export function resolveNotificationRoute(item: ApiTenantNotification): NotificationRoute | null {
  const id = item.entity_id;

  switch (item.action) {
    case 'PROFILE':
    case 'KYC':
      return '/(tabs)/profile';

    case 'SUPPORT':
      return { pathname: '/support', params: { kind: 'platform' } };

    case 'MAINTENANCE':
      return { pathname: '/support', params: { kind: 'property' } };

    case 'BOOKING':
      return id != null ? { pathname: '/booking/[ref]', params: { ref: String(id) } } : '/bookings';

    case 'INVOICE':
    case 'TRANSACTION':
      return '/billing';

    case 'LEASE':
      return '/lease';

    case 'REWARD':
      return '/rewards';

    case 'ANNOUNCEMENT':
      return '/(tabs)/stay';

    case 'VISITOR':
      return '/visitors';

    case 'MOVE_OUT':
      return '/move-out';

    case 'BED_CHANGE':
      return '/room-swap';

    case 'BROADCAST':
      return normalizeTargetLocation(item.target_location) ?? '/(tabs)';

    // Owner-only concepts — nothing to open in the tenant app.
    case 'PAYOUT':
    case 'SUBSCRIPTION':
      return null;

    default:
      return normalizeTargetLocation(item.target_location);
  }
}
