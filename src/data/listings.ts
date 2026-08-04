/** Discovery listings with full detail + room/bed matrices, reviews, food menus. */
import type {
  Listing, Floor, Room, Bed, SharingType, PricingTier, Gender, PropertyType,
  Certificate, ListingTag, Review, FoodDay,
  HourlyPricingTier, DailyPricingTier, ListingBookingConfig,
} from './types';
import type { BedStatusKey } from '@/theme/colors';
import { coverImages, mediaSectionsFor, avatarFor } from './images';

const CAPACITY: Record<SharingType, number> = {
  Single: 1, Double: 2, Triple: 3, '4-sharing': 4, Dormitory: 6,
};

const PATTERN: BedStatusKey[] = [
  'occupied', 'available', 'occupied', 'reserved', 'available',
  'occupied', 'available', 'occupied', 'available', 'occupied',
];

const REVIEW_TEXTS = [
  'Super clean rooms and the food is genuinely home-style. Warden is very responsive.',
  'Great location, walkable to my office. Wi-Fi is fast and power backup never failed.',
  'Safe and well-maintained. Housekeeping comes daily and the common areas are spotless.',
  'Good value for money. Rooms are spacious and the AC works perfectly through summer.',
  'Loved the community vibe and weekend events. Made friends quickly here.',
  'Booking was smooth and the QR check-in is so convenient. Highly recommend.',
];
const REVIEW_AUTHORS = ['Ananya I.', 'Rohan G.', 'Priya N.', 'Karthik R.', 'Sneha M.', 'Aditya V.', 'Meera K.', 'Varun S.'];

function makeReviews(seed: number, count: number): Review[] {
  const n = Math.min(4, Math.max(2, count % 4 || 3));
  return Array.from({ length: n }).map((_, i) => {
    const idx = (seed + i) % REVIEW_TEXTS.length;
    return {
      id: `rev-${seed}-${i}`,
      author: REVIEW_AUTHORS[(seed + i) % REVIEW_AUTHORS.length],
      avatar: avatarFor(`rev-${seed}-${i}`),
      rating: i === 0 ? 5 : 4,
      date: `2026-0${(i % 4) + 1}-1${i}`,
      text: REVIEW_TEXTS[idx],
    };
  });
}

interface SharingSpec { type: SharingType; rent: number }
interface ListingConfig {
  id: string;
  name: string;
  type: PropertyType;
  gender: Gender;
  locality: string;
  lat: number;
  lng: number;
  coverIdx: number;
  description: string;
  amenities: string[];
  houseRules: string[];
  pgfyScore: number;
  verified: boolean;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  foodIncluded: boolean;
  foodRating?: number;
  tags: ListingTag[];
  nearby: { label: string; distance: string; icon: string }[];
  securityDeposit: number;
  sharing: SharingSpec[];
  noticePeriodDays: number;
  lockInMonths: number;
  addedOn: string;
  verificationDate?: string;
  verificationExpiry?: string;
  hourlyEnabled?: boolean;
  dailyEnabled?: boolean;
  hourlyWindowStart?: string;
  hourlyWindowEnd?: string;
  dailyCheckIn?: string;
  dailyCheckOut?: string;
}

function genFloors(seedStr: string, sharing: SharingSpec[], securityDeposit: number): Floor[] {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  let bedCounter = seed % PATTERN.length;
  const floorNames = ['Ground', '1'];
  return floorNames.map((fname, fi) => {
    const rooms: Room[] = sharing.map((s, si) => {
      const cap = CAPACITY[s.type];
      const number = `${fname === 'Ground' ? 'G' : fname}${si + 1}`;
      const beds: Bed[] = Array.from({ length: cap }).map((_, bi) => {
        const status = PATTERN[bedCounter++ % PATTERN.length];
        return {
          id: `${seedStr}-${number}-${bi}`,
          label: String.fromCharCode(65 + bi),
          status,
          gender: 'Co-ed',
          rent: s.rent,
        };
      });
      const occupiedCount = beds.filter((b) => b.status === 'occupied').length;
      const r = (seed + fi * 7 + si * 3) >>> 0;
      const professionals = occupiedCount === 0 ? 0 : (r % (occupiedCount + 1));
      return {
        id: `${seedStr}-${number}`,
        number,
        sharingType: s.type,
        capacity: cap,
        rent: s.rent,
        deposit: securityDeposit,
        amenities: ['AC', 'Attached Bath', 'Study Table', 'Wardrobe'],
        photo: coverImages[(seed + fi + si) % coverImages.length],
        beds,
        occupied: occupiedCount,
        roommateProfile: {
          professionals,
          students: Math.max(0, occupiedCount - professionals),
          smoking: r % 4 === 0,
          alcohol: r % 3 === 0,
          sleep: r % 2 === 0 ? 'early' : 'late',
          diet: (['veg', 'nonveg', 'vegan'] as const)[r % 3],
        },
      };
    });
    return { id: `${seedStr}-f${fi}`, name: fname, rooms };
  });
}

const FOOD_MENU: FoodDay[] = [
  { meal: 'Breakfast', items: 'Idli, Vada, Poha, Tea/Coffee, Fruits' },
  { meal: 'Lunch', items: 'Rice, Roti, Dal, Sabzi, Curd, Salad' },
  { meal: 'Dinner', items: 'Roti, Paneer/Chicken curry, Rice, Dal, Sweet' },
];

const RATING_BREAKDOWN = [
  { label: 'Cleanliness', value: 4.6 },
  { label: 'Food', value: 4.3 },
  { label: 'Safety', value: 4.7 },
  { label: 'Staff', value: 4.5 },
  { label: 'Price', value: 4.2 },
];

const MANAGER_NAMES = ['Ramesh Kumar', 'Suresh Nair', 'Anil Reddy', 'Vijay Menon', 'Prakash Rao', 'Manoj Pillai', 'Karthik Iyer', 'Deepak Shetty'];

function buildListing(c: ListingConfig): Listing {
  const floors = genFloors(c.id, c.sharing, c.securityDeposit);
  const allBeds = floors.flatMap((f) => f.rooms.flatMap((r) => r.beds));
  const total = allBeds.length;
  const occupied = allBeds.filter((b) => b.status === 'occupied').length;
  const vacantBeds = allBeds.filter((b) => b.status === 'available').length;
  const pricing: PricingTier[] = c.sharing.map((s) => ({
    sharingType: s.type,
    rent: s.rent,
    available: allBeds.filter((b) => b.status === 'available' && b.rent === s.rent).length || 1,
  }));
  const certificates: Certificate[] = c.verified
    ? [
        { label: 'Trade License', status: 'Verified', expiry: '2027-03-31' },
        { label: 'Fire Safety Certificate', status: 'Verified', expiry: '2026-09-15' },
        { label: 'FSSAI License', status: c.foodIncluded ? 'Verified' : 'Missing', expiry: '2026-12-01' },
        { label: 'Property Documents', status: 'Verified' },
      ]
    : [
        { label: 'Trade License', status: 'Pending' },
        { label: 'Fire Safety Certificate', status: 'Pending' },
        { label: 'FSSAI License', status: 'Missing' },
        { label: 'Property Documents', status: 'Pending' },
      ];
  const hourlyPricing: HourlyPricingTier[] = c.hourlyEnabled
    ? c.sharing.map((s) => ({
        sharingType: s.type,
        rentPerHour: Math.round(s.rent / 100),
        available: allBeds.filter((b) => b.status === 'available' && b.rent === s.rent).length || 1,
      }))
    : [];
  const dailyPricing: DailyPricingTier[] = (c.dailyEnabled ?? true)
    ? c.sharing.map((s) => ({
        sharingType: s.type,
        rentPerDay: Math.round(s.rent / 25),
        available: allBeds.filter((b) => b.status === 'available' && b.rent === s.rent).length || 1,
      }))
    : [];
  const bookingConfig: ListingBookingConfig = {
    hourlyEnabled: c.hourlyEnabled ?? false,
    dailyEnabled: c.dailyEnabled ?? true,
    monthlyEnabled: true,
    hourly: c.hourlyEnabled ? { windowStart: c.hourlyWindowStart ?? '06:00', windowEnd: c.hourlyWindowEnd ?? '22:00' } : undefined,
    daily: (c.dailyEnabled ?? true) ? { checkInTime: c.dailyCheckIn ?? '12:00', checkOutTime: c.dailyCheckOut ?? '11:00' } : undefined,
  };
  const roomProfiles = floors.flatMap((f) => f.rooms.map((r) => r.roommateProfile!).filter(Boolean));
  const totalPros = roomProfiles.reduce((s, p) => s + p.professionals, 0);
  const totalStudents = roomProfiles.reduce((s, p) => s + p.students, 0);
  const majority = <T extends string>(vals: T[]): T =>
    vals.sort((a, b) => vals.filter((v) => v === b).length - vals.filter((v) => v === a).length)[0];
  const roommateSummary = {
    mostlyProfessionals: totalPros >= totalStudents,
    smoking: roomProfiles.filter((p) => p.smoking).length > roomProfiles.length / 2,
    alcohol: roomProfiles.filter((p) => p.alcohol).length > roomProfiles.length / 2,
    sleep: majority(roomProfiles.map((p) => p.sleep)),
    diet: majority(roomProfiles.map((p) => p.diet)),
  };
  const seedNum = c.coverIdx + c.id.length;
  const managerNum = 9000000000 + ((seedNum * 48271) % 999999999);
  const manager = {
    name: MANAGER_NAMES[seedNum % MANAGER_NAMES.length],
    phone: `+91 ${String(managerNum).slice(0, 5)} ${String(managerNum).slice(5)}`,
  };
  const mediaSections = mediaSectionsFor(seedNum, c.coverIdx);
  const gallery = mediaSections.flatMap((s) => s.images);
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    gender: c.gender,
    locality: c.locality,
    city: 'Bengaluru',
    addressLine: `#${(seedNum % 90) + 1}, ${c.locality} Main Road`,
    pincode: '5600' + (10 + (seedNum % 89)),
    lat: c.lat,
    lng: c.lng,
    coverImage: gallery[0] ?? coverImages[c.coverIdx % coverImages.length],
    gallery,
    mediaSections,
    hasVideoTour: c.coverIdx % 2 === 0,
    description: c.description,
    priceFrom: Math.min(...c.sharing.map((s) => s.rent)),
    securityDeposit: c.securityDeposit,
    rating: c.rating,
    reviewCount: c.reviewCount,
    pgfyScore: c.pgfyScore,
    verified: c.verified,
    verificationDate: c.verificationDate,
    verificationExpiry: c.verificationExpiry,
    certificates,
    distanceKm: c.distanceKm,
    amenities: c.amenities,
    houseRules: c.houseRules,
    foodIncluded: c.foodIncluded,
    foodRating: c.foodRating,
    foodMenu: FOOD_MENU,
    pricing,
    floors,
    vacantBeds,
    occupancyPct: Math.round((occupied / total) * 100),
    tags: c.tags,
    nearby: c.nearby,
    reviews: makeReviews(seedNum, c.reviewCount),
    ratingBreakdown: RATING_BREAKDOWN,
    noticePeriodDays: c.noticePeriodDays,
    lockInMonths: c.lockInMonths,
    addedOn: c.addedOn,
    bookingConfig,
    hourlyPricing,
    dailyPricing,
    roommateSummary,
    manager,
  };
}

const BASE_AMENITIES = ['Wi-Fi', 'Power Backup', 'Daily Housekeeping', 'CCTV Surveillance', 'Hot Water', 'RO Water', 'Washing Machine', 'Lift Facility'];
const RULES = ['Entry till 11:30 PM', 'No smoking indoors', 'Guests in common area only', 'ID proof mandatory'];

export const LISTINGS: Listing[] = [
  buildListing({
    id: 'l1', name: 'Urbanest Stays', type: 'Co-living', gender: 'Co-ed', locality: 'Koramangala', lat: 12.9352, lng: 77.6245,
    coverIdx: 0, description: 'Premium co-living in the heart of Koramangala — steps from cafés, tech parks and the metro. Curated community, chef-prepared meals and ergonomic workspaces.',
    amenities: [...BASE_AMENITIES, 'Gym', 'Parking', 'Dedicated Security', 'AC'], houseRules: RULES,
    pgfyScore: 5.0, verified: true, rating: 4.7, reviewCount: 168, distanceKm: 1.2, foodIncluded: true, foodRating: 4.4,
    tags: [], nearby: [{ label: 'Forum Mall', distance: '900 m', icon: 'storefront-outline' }, { label: 'Metro Station', distance: '1.4 km', icon: 'train-outline' }, { label: 'Christ University', distance: '2.1 km', icon: 'school-outline' }],
    securityDeposit: 36000,
    sharing: [{ type: 'Single', rent: 18000 }, { type: 'Double', rent: 13000 }, { type: 'Triple', rent: 9500 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2025-08-10', verificationDate: '2025-11-12', verificationExpiry: '2026-11-12',
    hourlyEnabled: true, dailyEnabled: true, hourlyWindowStart: '06:00', hourlyWindowEnd: '22:00', dailyCheckIn: '12:00', dailyCheckOut: '11:00',
  }),
  buildListing({
    id: 'l2', name: 'The Nest PG', type: 'PG', gender: 'Male', locality: 'HSR Layout', lat: 12.9116, lng: 77.6389,
    coverIdx: 7, description: 'A well-run male PG with home-style food and a friendly warden. Quiet, safe and ideal for working professionals.',
    amenities: [...BASE_AMENITIES, 'Pure Veg', 'Study Table'], houseRules: RULES,
    pgfyScore: 4.5, verified: true, rating: 4.6, reviewCount: 112, distanceKm: 2.4, foodIncluded: true, foodRating: 4.5,
    tags: [], nearby: [{ label: 'HSR BDA Complex', distance: '600 m', icon: 'storefront-outline' }, { label: 'Bus Stop', distance: '300 m', icon: 'bus-outline' }],
    securityDeposit: 33000,
    sharing: [{ type: 'Single', rent: 16500 }, { type: 'Double', rent: 11500 }, { type: 'Triple', rent: 9000 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2025-02-22', verificationDate: '2026-01-08', verificationExpiry: '2027-01-08',
    hourlyEnabled: true, dailyEnabled: true, hourlyWindowStart: '06:00', hourlyWindowEnd: '22:00', dailyCheckIn: '14:00', dailyCheckOut: '12:00',
  }),
  buildListing({
    id: 'l3', name: 'Blossom Girls PG', type: 'PG', gender: 'Female', locality: 'Indiranagar', lat: 12.9719, lng: 77.6412,
    coverIdx: 11, description: 'Safe, friendly girls PG with 24×7 security, biometric entry and warm home-cooked food. A trusted address for students and working women.',
    amenities: [...BASE_AMENITIES, 'Dedicated Security', 'Medical Support', 'Pure Veg'], houseRules: ['Entry till 10:00 PM', 'Biometric entry', 'No male visitors above ground floor', 'ID mandatory'],
    pgfyScore: 4.5, verified: true, rating: 4.5, reviewCount: 96, distanceKm: 3.1, foodIncluded: true, foodRating: 4.2,
    tags: ['New'], nearby: [{ label: '100 Ft Road', distance: '700 m', icon: 'storefront-outline' }, { label: 'Metro Station', distance: '1.1 km', icon: 'train-outline' }],
    securityDeposit: 24000,
    sharing: [{ type: 'Double', rent: 12000 }, { type: 'Triple', rent: 9000 }, { type: '4-sharing', rent: 7500 }],
    noticePeriodDays: 30, lockInMonths: 4, addedOn: '2024-11-05', verificationDate: '2025-09-30', verificationExpiry: '2026-09-15',
    hourlyEnabled: false, dailyEnabled: true, dailyCheckIn: '12:00', dailyCheckOut: '10:00',
  }),
  buildListing({
    id: 'l4', name: 'Hive Co-living', type: 'Co-living', gender: 'Co-ed', locality: 'Whitefield', lat: 12.9698, lng: 77.7499,
    coverIdx: 9, description: 'Modern co-living near ITPL with smart-access rooms, a rooftop lounge and a productivity-first community.',
    amenities: [...BASE_AMENITIES, 'Gym', 'Parking', 'AC'], houseRules: ['No entry restrictions', 'Smart-lock access', 'Quiet hours after 11 PM'],
    pgfyScore: 4.0, verified: true, rating: 4.4, reviewCount: 74, distanceKm: 12.5, foodIncluded: false,
    tags: ['New'], nearby: [{ label: 'ITPL', distance: '1.0 km', icon: 'business-outline' }, { label: 'Phoenix Mall', distance: '2.3 km', icon: 'storefront-outline' }],
    securityDeposit: 39000,
    sharing: [{ type: 'Single', rent: 19500 }, { type: 'Double', rent: 14000 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2026-02-18', verificationDate: '2026-02-20', verificationExpiry: '2027-02-20',
    hourlyEnabled: true, dailyEnabled: true, hourlyWindowStart: '08:00', hourlyWindowEnd: '20:00', dailyCheckIn: '14:00', dailyCheckOut: '12:00',
  }),
  buildListing({
    id: 'l5', name: 'ZenStay Hostel', type: 'Hostel', gender: 'Co-ed', locality: 'BTM Layout', lat: 12.9166, lng: 77.6101,
    coverIdx: 4, description: 'Budget-friendly hostel with a vibrant backpacker-meets-student community, fast Wi-Fi and a lively common room.',
    amenities: [...BASE_AMENITIES], houseRules: RULES,
    pgfyScore: 4.0, verified: true, rating: 4.3, reviewCount: 58, distanceKm: 4.8, foodIncluded: true, foodRating: 3.9,
    tags: [], nearby: [{ label: 'BTM Bus Depot', distance: '500 m', icon: 'bus-outline' }, { label: 'Tech Park', distance: '2.0 km', icon: 'business-outline' }],
    securityDeposit: 17000,
    sharing: [{ type: 'Triple', rent: 8500 }, { type: '4-sharing', rent: 7000 }, { type: 'Dormitory', rent: 5500 }],
    noticePeriodDays: 15, lockInMonths: 3, addedOn: '2025-06-12', verificationDate: '2025-10-01', verificationExpiry: '2026-10-01',
    hourlyEnabled: false, dailyEnabled: true, dailyCheckIn: '12:00', dailyCheckOut: '11:00',
  }),
  buildListing({
    id: 'l6', name: 'CitiNest', type: 'PG', gender: 'Male', locality: 'Marathahalli', lat: 12.9569, lng: 77.7011,
    coverIdx: 2, description: 'Comfortable male PG close to ORR tech corridors. Spacious rooms, reliable power backup and tasty meals.',
    amenities: [...BASE_AMENITIES, 'Parking', 'Study Table'], houseRules: RULES,
    pgfyScore: 4.0, verified: true, rating: 4.2, reviewCount: 67, distanceKm: 9.2, foodIncluded: true, foodRating: 4.0,
    tags: [], nearby: [{ label: 'Innovative Multiplex', distance: '800 m', icon: 'storefront-outline' }, { label: 'ORR Bus Stop', distance: '400 m', icon: 'bus-outline' }],
    securityDeposit: 30000,
    sharing: [{ type: 'Single', rent: 15000 }, { type: 'Double', rent: 10500 }, { type: 'Triple', rent: 8500 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2025-04-01', verificationDate: '2025-12-01', verificationExpiry: '2026-12-01',
    hourlyEnabled: false, dailyEnabled: false,
  }),
  buildListing({
    id: 'l7', name: 'Serene Living', type: 'Co-living', gender: 'Co-ed', locality: 'Electronic City', lat: 12.8452, lng: 77.6602,
    coverIdx: 5, description: 'Calm, green co-living near Electronic City Phase 1. Designer interiors, gym and a café-style dining hall.',
    amenities: [...BASE_AMENITIES, 'Gym', 'Parking', 'AC', 'Dedicated Security'], houseRules: RULES,
    pgfyScore: 4.5, verified: true, rating: 4.6, reviewCount: 103, distanceKm: 16.1, foodIncluded: true, foodRating: 4.4,
    tags: [], nearby: [{ label: 'Infosys Gate 1', distance: '1.5 km', icon: 'business-outline' }, { label: 'Neotown', distance: '900 m', icon: 'storefront-outline' }],
    securityDeposit: 34000,
    sharing: [{ type: 'Single', rent: 17000 }, { type: 'Double', rent: 12500 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2025-03-15', verificationDate: '2025-11-20', verificationExpiry: '2026-11-20',
    hourlyEnabled: false, dailyEnabled: true, dailyCheckIn: '14:00', dailyCheckOut: '12:00',
  }),
  buildListing({
    id: 'l8', name: 'Lotus Ladies PG', type: 'PG', gender: 'Female', locality: 'Jayanagar', lat: 12.9250, lng: 77.5938,
    coverIdx: 12, description: 'Homely ladies PG in leafy Jayanagar with hygienic food, attentive staff and excellent connectivity.',
    amenities: [...BASE_AMENITIES, 'Dedicated Security', 'Pure Veg', 'Medical Support'], houseRules: ['Entry till 10:30 PM', 'No male visitors', 'ID mandatory'],
    pgfyScore: 4.5, verified: true, rating: 4.4, reviewCount: 81, distanceKm: 5.6, foodIncluded: true, foodRating: 4.3,
    tags: [], nearby: [{ label: 'Jayanagar 4th Block', distance: '600 m', icon: 'storefront-outline' }, { label: 'Metro Station', distance: '1.2 km', icon: 'train-outline' }],
    securityDeposit: 23000,
    sharing: [{ type: 'Double', rent: 11500 }, { type: 'Triple', rent: 9000 }],
    noticePeriodDays: 30, lockInMonths: 4, addedOn: '2025-01-20', verificationDate: '2025-10-10', verificationExpiry: '2026-10-10',
    hourlyEnabled: false, dailyEnabled: false,
  }),
  buildListing({
    id: 'l9', name: 'MetroStay', type: 'Co-living', gender: 'Co-ed', locality: 'MG Road', lat: 12.9756, lng: 77.6066,
    coverIdx: 8, description: 'Central co-living right on MG Road. Walk to work, dining and nightlife. Currently completing PGfy verification.',
    amenities: [...BASE_AMENITIES, 'Gym', 'AC'], houseRules: RULES,
    pgfyScore: 0, verified: false, rating: 4.1, reviewCount: 22, distanceKm: 2.0, foodIncluded: false,
    tags: [], nearby: [{ label: 'MG Road Metro', distance: '250 m', icon: 'train-outline' }, { label: 'Brigade Road', distance: '700 m', icon: 'storefront-outline' }],
    securityDeposit: 42000,
    sharing: [{ type: 'Single', rent: 21000 }, { type: 'Double', rent: 15000 }],
    noticePeriodDays: 30, lockInMonths: 6, addedOn: '2026-04-28',
    hourlyEnabled: false, dailyEnabled: false,
  }),
  buildListing({
    id: 'l10', name: 'CampusHub Hostel', type: 'Hostel', gender: 'Male', locality: 'Yelahanka', lat: 13.1007, lng: 77.5963,
    coverIdx: 6, description: 'Student-focused hostel near major colleges with study zones, fast Wi-Fi and affordable sharing options.',
    amenities: [...BASE_AMENITIES, 'Study Table'], houseRules: RULES,
    pgfyScore: 4.0, verified: true, rating: 4.3, reviewCount: 49, distanceKm: 18.4, foodIncluded: true, foodRating: 4.0,
    tags: ['New'], nearby: [{ label: 'REVA University', distance: '1.0 km', icon: 'school-outline' }, { label: 'Bus Stand', distance: '500 m', icon: 'bus-outline' }],
    securityDeposit: 19000,
    sharing: [{ type: 'Double', rent: 9500 }, { type: 'Triple', rent: 7500 }, { type: '4-sharing', rent: 6500 }],
    noticePeriodDays: 15, lockInMonths: 3, addedOn: '2026-03-05', verificationDate: '2026-03-10', verificationExpiry: '2027-03-10',
    hourlyEnabled: false, dailyEnabled: true, dailyCheckIn: '12:00', dailyCheckOut: '11:00',
  }),
];

export function getListing(id: string): Listing | undefined {
  return LISTINGS.find((l) => l.id === id);
}
