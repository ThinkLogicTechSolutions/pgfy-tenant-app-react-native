/**
 * Brand Rewards & Coupons — partner vendors and offers (admin-managed catalog).
 * Tenants earn scratch cards after booking and redeem codes with partner brands.
 */

export type VendorCategory =
  | 'Food'
  | 'Shopping'
  | 'Travel'
  | 'Education'
  | 'Entertainment'
  | 'Healthcare';

export type OfferCouponType = 'unique' | 'common';

export type ScratchCardStatus = 'locked' | 'revealed' | 'expired' | 'redeemed';

export interface BrandVendor {
  id: string;
  name: string;
  logo: string;
  category: VendorCategory;
  websiteUrl: string;
  terms: string;
}

export interface BrandOffer {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  bannerImage: string;
  expiresAt: string;
  couponType: OfferCouponType;
  commonCode?: string;
  redemptionInstructions: string;
  terms: string;
  termsUrl: string;
  offerUrl: string;
}

/** Tenant-owned reward instance (scratch card → revealed coupon). */
export interface TenantReward {
  id: string;
  status: ScratchCardStatus;
  offerId: string;
  vendorId: string;
  couponCode?: string;
  earnedAt: string;
  expiresAt: string;
  revealedAt?: string;
  bookingRef: string;
  propertyName: string;
}

export const VENDOR_CATEGORY_ICON: Record<VendorCategory, string> = {
  Food: 'restaurant-outline',
  Shopping: 'bag-handle-outline',
  Travel: 'airplane-outline',
  Education: 'school-outline',
  Entertainment: 'film-outline',
  Healthcare: 'medkit-outline',
};

export const BRAND_VENDORS: BrandVendor[] = [
  {
    id: 'v-swiggy',
    name: 'Swiggy',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80&auto=format&fit=crop',
    category: 'Food',
    websiteUrl: 'https://www.swiggy.com',
    terms: 'Valid on orders above ₹199. One use per user. Cannot be combined with other offers.',
  },
  {
    id: 'v-amazon',
    name: 'Amazon',
    logo: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80&auto=format&fit=crop',
    category: 'Shopping',
    websiteUrl: 'https://www.amazon.in',
    terms: 'Applicable on select categories. Max discount as per offer cap.',
  },
  {
    id: 'v-mmt',
    name: 'MakeMyTrip',
    logo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=200&q=80&auto=format&fit=crop',
    category: 'Travel',
    websiteUrl: 'https://www.makemytrip.com',
    terms: 'Valid on domestic hotel bookings. Blackout dates may apply.',
  },
  {
    id: 'v-bms',
    name: 'BookMyShow',
    logo: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80&auto=format&fit=crop',
    category: 'Entertainment',
    websiteUrl: 'https://in.bookmyshow.com',
    terms: 'Valid on movie tickets. Not valid on F&B or merchandise.',
  },
  {
    id: 'v-zepto',
    name: 'Zepto',
    logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80&auto=format&fit=crop',
    category: 'Food',
    websiteUrl: 'https://www.zeptonow.com',
    terms: 'Valid on grocery orders. Delivery charges may apply separately.',
  },
  {
    id: 'v-pharmeasy',
    name: 'PharmEasy',
    logo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80&auto=format&fit=crop',
    category: 'Healthcare',
    websiteUrl: 'https://pharmeasy.in',
    terms: 'Valid on medicine orders. Prescription required where applicable.',
  },
];

export const BRAND_OFFERS: BrandOffer[] = [
  {
    id: 'off-1',
    vendorId: 'v-swiggy',
    title: '₹150 off on food delivery',
    description: 'Treat yourself after move-in — flat ₹150 off your next Swiggy order.',
    bannerImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-08-31',
    couponType: 'unique',
    redemptionInstructions: 'Open Swiggy → Cart → Apply coupon → Paste your code at checkout.',
    terms: 'Min order ₹199. Valid once per user.',
    termsUrl: 'https://www.swiggy.com/terms-and-conditions',
    offerUrl: 'https://www.swiggy.com',
  },
  {
    id: 'off-2',
    vendorId: 'v-amazon',
    title: '10% off up to ₹500',
    description: 'Home essentials for your new room — extra savings on Amazon.',
    bannerImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-09-15',
    couponType: 'unique',
    redemptionInstructions: 'Visit amazon.in → Add items → Enter code under Gift Cards & Promotional Codes.',
    terms: 'Select home & kitchen categories only.',
    termsUrl: 'https://www.amazon.in/gp/help/customer/display.html',
    offerUrl: 'https://www.amazon.in',
  },
  {
    id: 'off-3',
    vendorId: 'v-mmt',
    title: '₹800 off weekend getaway',
    description: 'Plan a break — discount on domestic hotel stays.',
    bannerImage: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-10-01',
    couponType: 'common',
    commonCode: 'PGFYTRAVEL800',
    redemptionInstructions: 'Book on MakeMyTrip app → Payment → Apply promo code PGfyTRAVEL800.',
    terms: 'Min booking ₹3,000. Weekday stays excluded.',
    termsUrl: 'https://www.makemytrip.com/legal/user/agreement.html',
    offerUrl: 'https://www.makemytrip.com',
  },
  {
    id: 'off-4',
    vendorId: 'v-bms',
    title: 'Buy 1 Get 1 movie ticket',
    description: 'Weekend entertainment — BOGO on select screenings.',
    bannerImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-07-31',
    couponType: 'unique',
    redemptionInstructions: 'BookMyShow app → Select seats → Offers → Enter unique code.',
    terms: 'Mon–Thu shows only. Max 2 tickets.',
    termsUrl: 'https://in.bookmyshow.com/terms-and-conditions',
    offerUrl: 'https://in.bookmyshow.com',
  },
  {
    id: 'off-5',
    vendorId: 'v-zepto',
    title: '₹100 off groceries',
    description: 'Stock your pantry — instant delivery from Zepto.',
    bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-08-15',
    couponType: 'common',
    commonCode: 'PGFYZEPTO100',
    redemptionInstructions: 'Zepto app → Cart → Have a coupon? → Enter PGFYZEPTO100.',
    terms: 'First order on Zepto only.',
    termsUrl: 'https://www.zeptonow.com/terms-of-service',
    offerUrl: 'https://www.zeptonow.com',
  },
  {
    id: 'off-6',
    vendorId: 'v-pharmeasy',
    title: '20% off medicines',
    description: 'Healthcare essentials with PharmEasy — up to ₹200 off.',
    bannerImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80&auto=format&fit=crop',
    expiresAt: '2026-09-30',
    couponType: 'unique',
    redemptionInstructions: 'PharmEasy app → Upload prescription if needed → Apply code at payment.',
    terms: 'OTC items only for non-prescription use.',
    termsUrl: 'https://pharmeasy.in/legal/terms-and-conditions',
    offerUrl: 'https://pharmeasy.in',
  },
];

export function getVendor(id: string): BrandVendor | undefined {
  return BRAND_VENDORS.find((v) => v.id === id);
}

export function getOffer(id: string): BrandOffer | undefined {
  return BRAND_OFFERS.find((o) => o.id === id);
}

export function activeOffers(now = new Date()): BrandOffer[] {
  const today = now.toISOString().slice(0, 10);
  return BRAND_OFFERS.filter((o) => o.expiresAt >= today);
}

export function pickRandomOffer(seed: string): BrandOffer {
  const pool = activeOffers();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[h % pool.length] ?? pool[0];
}

export function generateUniqueCode(vendorId: string, rewardId: string): string {
  const prefix = vendorId.replace('v-', '').slice(0, 4).toUpperCase();
  const suffix = rewardId.replace(/\D/g, '').slice(-6).padStart(6, '0');
  return `PGFY-${prefix}${suffix}`;
}

export function scratchCardExpiryDays(): number {
  return 30;
}

export function isRewardExpired(reward: TenantReward, now = new Date()): boolean {
  const today = now.toISOString().slice(0, 10);
  return reward.expiresAt < today;
}

export function isRewardOpened(reward: TenantReward): boolean {
  return reward.status === 'revealed' || reward.status === 'redeemed';
}

/** Demo scratch cards covering all visual states for the Rewards grid. */
export const DEMO_SCRATCH_CARDS: TenantReward[] = [
  {
    id: 'demo-locked',
    status: 'locked',
    offerId: 'off-1',
    vendorId: 'v-swiggy',
    earnedAt: '2026-06-01T10:00:00+05:30',
    expiresAt: '2026-07-15',
    bookingRef: 'DEMO-LOCKED',
    propertyName: 'PGfy Nest — Koramangala',
  },
  {
    id: 'demo-opened',
    status: 'revealed',
    offerId: 'off-2',
    vendorId: 'v-amazon',
    couponCode: 'PGFY-AMAZ042891',
    earnedAt: '2026-05-20T14:00:00+05:30',
    expiresAt: '2026-08-01',
    revealedAt: '2026-05-21T09:30:00+05:30',
    bookingRef: 'DEMO-OPENED',
    propertyName: 'UrbanStay Residency — HSR',
  },
  {
    id: 'demo-locked-expired',
    status: 'locked',
    offerId: 'off-4',
    vendorId: 'v-bms',
    earnedAt: '2026-04-01T11:00:00+05:30',
    expiresAt: '2026-05-01',
    bookingRef: 'DEMO-LOCK-EXP',
    propertyName: 'Sunrise Girls Hostel',
  },
  {
    id: 'demo-opened-expired',
    status: 'revealed',
    offerId: 'off-5',
    vendorId: 'v-zepto',
    couponCode: 'PGFYZEPTO100',
    earnedAt: '2026-03-10T16:00:00+05:30',
    expiresAt: '2026-04-10',
    revealedAt: '2026-03-12T08:00:00+05:30',
    bookingRef: 'DEMO-OPEN-EXP',
    propertyName: 'PGfy Nest — Koramangala',
  },
];
