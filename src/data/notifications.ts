/** Tenant notifications. */
import type { NotificationItem } from './types';

export const NOTIFICATIONS: NotificationItem[] = [
  { id: 'n1', type: 'Rent Reminder', title: 'Rent due in 7 days', body: 'Your June rent of ₹13,000 is due on 5 Jun 2026.', timestamp: '2026-05-29T08:00:00+05:30', read: false },
  { id: 'n2', type: 'Ticket Update', title: 'Ticket in progress', body: 'Your Wi-Fi ticket TKT-5012 is being worked on.', timestamp: '2026-05-29T09:10:00+05:30', read: false },
  { id: 'n3', type: 'Lease Expiry', title: 'Sign your lease', body: 'Your digital lease agreement is ready for signature.', timestamp: '2026-05-28T12:00:00+05:30', read: false },
  { id: 'n4', type: 'Visitor Alert', title: 'Visitor OTP generated', body: 'OTP for Rajesh Sharma is active until expiry.', timestamp: '2026-05-28T16:30:00+05:30', read: true },
  { id: 'n5', type: 'Announcement', title: 'Water supply notice', body: 'Maintenance work on 1 Jun, 10 AM–12 PM. Plan accordingly.', timestamp: '2026-05-27T18:00:00+05:30', read: true },
  { id: 'n6', type: 'Booking Update', title: 'Booking confirmed', body: 'Welcome to Urbanest Stays! Your bed 101-B is confirmed.', timestamp: '2026-03-05T10:00:00+05:30', read: true },
];

export const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;
