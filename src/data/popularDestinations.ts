/**
 * Home popular destinations (cities).
 *
 * Each city renders as an illustrated landmark tile (e.g. Vidhana Soudha for
 * Bengaluru, Charminar for Hyderabad). `landmarkId` selects the built-in
 * illustration; admins can override a tile with uploaded artwork via `image`.
 */
import type { LandmarkId } from '@/components/illustrations';

export type PopularDestination = {
  id: string;
  name: string;
  subtitle: string;
  /** Built-in landmark illustration key. */
  landmarkId: LandmarkId;
  /** Admin-uploaded artwork (overrides the built-in illustration). */
  image?: string;
  /** Recently added city — shows a "NEW" badge. */
  isNew?: boolean;
};

export const POPULAR_DESTINATIONS: PopularDestination[] = [
  { id: 'blr', name: 'Bengaluru', subtitle: '120+ PGs', landmarkId: 'vidhanaSoudha' },
  { id: 'che', name: 'Chennai', subtitle: '70+ PGs', landmarkId: 'gopuram' },
  { id: 'hyd', name: 'Hyderabad', subtitle: '95+ PGs', landmarkId: 'charminar' },
  { id: 'pun', name: 'Pune', subtitle: '80+ PGs', landmarkId: 'fort' },
  { id: 'mum', name: 'Mumbai', subtitle: '110+ PGs', landmarkId: 'gateway', isNew: true },
  { id: 'del', name: 'Delhi NCR', subtitle: '140+ PGs', landmarkId: 'indiaGate', isNew: true },
  { id: 'kol', name: 'Kolkata', subtitle: '65+ PGs', landmarkId: 'victoria' },
  { id: 'ahm', name: 'Ahmedabad', subtitle: '55+ PGs', landmarkId: 'mosque', isNew: true },
];
