/** Tenant notifications — no real notifications API/feed exists yet, so this stays empty
 * (was previously seeded with demo rows) rather than showing fake activity. */
import type { NotificationItem } from './types';

export const NOTIFICATIONS: NotificationItem[] = [];

export const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
