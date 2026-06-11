/** Tenant rewards — scratch cards earned after booking. */
import { useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TenantReward } from '@/data/brandRewards';
import {
  pickRandomOffer,
  generateUniqueCode,
  scratchCardExpiryDays,
  getOffer,
  DEMO_SCRATCH_CARDS,
  isRewardExpired,
  isRewardOpened,
} from '@/data/brandRewards';

const STORAGE_KEY = '@pgfy/tenant-rewards';

let rewards: TenantReward[] = [];
let hydrated = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function ensureDemoCards() {
  for (const demo of DEMO_SCRATCH_CARDS) {
    if (!rewards.some((r) => r.id === demo.id)) {
      rewards.push(demo);
    }
  }
  rewards.sort((a, b) => b.earnedAt.localeCompare(a.earnedAt));
}

async function persist() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
  } catch {
    // Non-critical for mockup.
  }
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) rewards = JSON.parse(raw) as TenantReward[];
  } catch {
    rewards = [];
  }
  ensureDemoCards();
  persist();
  emit();
}

export async function initRewards() {
  await hydrate();
}

export function getRewards(): TenantReward[] {
  return [...rewards];
}

export function grantScratchCard(bookingRef: string, propertyName: string): TenantReward | null {
  if (rewards.some((r) => r.bookingRef === bookingRef)) return null;

  const offer = pickRandomOffer(bookingRef);
  const id = `rw-${Date.now()}`;
  const item: TenantReward = {
    id,
    status: 'locked',
    offerId: offer.id,
    vendorId: offer.vendorId,
    earnedAt: new Date().toISOString(),
    expiresAt: addDaysIso(scratchCardExpiryDays()),
    bookingRef,
    propertyName,
  };
  rewards = [item, ...rewards];
  persist();
  emit();
  return item;
}

export function revealReward(rewardId: string): TenantReward | undefined {
  const idx = rewards.findIndex((r) => r.id === rewardId);
  if (idx < 0) return undefined;

  const current = rewards[idx];
  if (current.status !== 'locked') return current;
  if (isRewardExpired(current)) return current;

  const offer = getOffer(current.offerId);
  const couponCode = offer?.couponType === 'common'
    ? offer.commonCode
    : generateUniqueCode(current.vendorId, current.id);

  const updated: TenantReward = {
    ...current,
    status: 'revealed',
    couponCode,
    revealedAt: new Date().toISOString(),
  };
  rewards = rewards.map((r) => (r.id === rewardId ? updated : r));
  persist();
  emit();
  return updated;
}

export function markRedeemed(rewardId: string) {
  rewards = rewards.map((r) =>
    r.id === rewardId && r.status === 'revealed' ? { ...r, status: 'redeemed' as const } : r,
  );
  persist();
  emit();
}

export function useRewards() {
  const [, force] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    hydrate().then(() => force());
    listeners.add(force);
    return () => { listeners.delete(force); };
  }, []);

  const all = getRewards();
  const locked = all.filter((r) => r.status === 'locked' && !isRewardExpired(r));
  const revealed = all.filter((r) => isRewardOpened(r));

  return {
    rewards: all,
    locked,
    revealed,
    lockedCount: locked.length,
    grantScratchCard,
    revealReward,
    markRedeemed,
  };
}
