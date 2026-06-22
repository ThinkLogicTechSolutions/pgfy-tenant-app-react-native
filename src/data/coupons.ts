/** Promo codes available at booking checkout. */
export interface Coupon {
  code: string;
  title: string;
  description: string;
  discount: number;
}

export const COUPONS: Coupon[] = [
  {
    code: 'WELCOME500',
    title: 'Welcome offer',
    description: 'Flat ₹500 off your first PGfy booking',
    discount: 500,
  },
  {
    code: 'MOVEIN1K',
    title: 'Move-in month',
    description: '₹1,000 off when you check in this month',
    discount: 1000,
  },
  {
    code: 'STUDENT200',
    title: 'Student perk',
    description: '₹200 off for student ID holders',
    discount: 200,
  },
  {
    code: 'REFER250',
    title: 'Refer & book',
    description: '₹250 off — use a friend’s referral code',
    discount: 250,
  },
  {
    code: 'FLASH15',
    title: 'Flash deal',
    description: '15% off platform fee (max ₹300)',
    discount: 300,
  },
];

export function resolveCoupon(code: string): Coupon | undefined {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((c) => c.code === normalized);
}
