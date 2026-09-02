# PGfy — Tenant App (Mockup)

A high-fidelity **React Native (Expo SDK 54)** mockup of the PGfy **tenant** app — the
PG / Hostel / Co-living discovery-and-booking marketplace from the PGfy PRD (the **T-S**
screen series). It ships with realistic mock data, a full design system, custom SVG
illustrations, a splash screen and 3 onboarding screens.

> This is a **UI/UX mockup**: all data is local and static (no backend). Network is only
> used to load remote demo photos & avatars; everything else works offline.

---

## ✨ Highlights

- **Marketplace design language** — a **deep-navy brand** (`#01264E`, extracted from the
  tenant logo with ImageMagick) paired with the energetic **PGfy coral** (`#FF4B3E`) as the
  action/CTA color. Benchmarked in spirit to Booking.com / MakeMyTrip: image-forward cards,
  trust badges, clean cool-grey surfaces. Inter typography throughout.
- **30+ screens** covering the full tenant journey: splash → onboarding → landing (guest) →
  phone/OTP/register → SnapKYC → discovery home, search & filters, results, map, compare,
  property details, room/bed selection, booking config & billing, checkout, payment success,
  QR pass → post-booking dashboard, lease e-sign, billing, visitors, support, room-swap,
  move-out, notifications, profile.
- **Hand-built SVG illustrations** for onboarding and every empty state — themed, no
  third-party illustration downloads.
- **Cross-platform safe areas** — top & bottom insets via `react-native-safe-area-context`;
  Android edge-to-edge + iOS notch/home-indicator aware.
- **Reanimated 4 micro-interactions** — press-scale, onboarding parallax + animated dots,
  spring bottom sheets, success animations, image-carousel paging.
- **Guest vs. logged-in** flows, a cross-screen **Saved/shortlist** store, live **filters**,
  **sort**, and **compare (up to 3)**.

---

## 🚀 Getting started

```bash
cd tenant-app
npm install            # already run if node_modules/ exists
npx expo start -c      # -c clears Metro cache; press i (iOS) / a (Android)
```

Type-check & bundle (both verified passing):

```bash
npx tsc --noEmit                         # 0 errors
npx expo export --platform ios           # bundles 1693 modules, exit 0
```

### Demo flow
First launch: **Splash → Onboarding → Landing**. From Landing, tap **Explore PGs near you**
to browse as a guest, or **Login / Register** (OTP accepts **any 6 digits**, then a quick
name step). Booking a verified property routes through **Select bed → Review → Checkout →
Success → Pass**; KYC is requested at the booking gate (tap through to verify). The
**My Stay** tab is the post-booking hub. Reset via **Profile → Replay onboarding / Log out**.

---

## 🗂 Project structure

```
tenant-app/
├── app/                                # expo-router routes (file-based)
│   ├── _layout.tsx                     # root: Inter fonts, providers, Stack, splash control
│   ├── index.tsx                       # T-S1  animated boot splash → routes by session
│   ├── onboarding.tsx                  # T-S2  3-slide intro (parallax + dots)
│   ├── landing.tsx                     # T-S3  guest discovery entry (hero)
│   ├── +not-found.tsx
│   ├── (auth)/
│   │   ├── login.tsx                   # T-S4  mobile number entry (+ guest)
│   │   ├── verify-otp.tsx              # T-S5  6-cell OTP
│   │   ├── register.tsx                # T-S6  basic registration
│   │   └── kyc.tsx                     # T-S7  profile completion & SnapKYC (5-step)
│   ├── (tabs)/
│   │   ├── _layout.tsx                 # bottom tabs: Home · Explore · My Stay · Profile
│   │   ├── index.tsx                   # T-S8  discovery home (rails, promos, map CTA)
│   │   ├── explore.tsx                 #        all listings + search/sort/saved
│   │   ├── stay.tsx                    # T-S20 post-booking dashboard hub
│   │   └── profile.tsx                 # T-S27 profile & settings
│   ├── search.tsx                      # T-S9  search & filters (modal)
│   ├── results.tsx                     # T-S10 results list + sort + compare bar
│   ├── map.tsx                         # T-S11 map view (clustered pins + preview)
│   ├── compare.tsx                     # T-S12 compare up to 3 properties
│   ├── listing/
│   │   ├── [id].tsx                    # T-S13 property details (gallery, trust, reviews, food)
│   │   └── [id]/
│   │       ├── select.tsx              # T-S14 room & bed selection grid
│   │       ├── request.tsx             #        "Request This Property" (unverified)
│   │       ├── book.tsx                # T-S15 booking config & billing (KYC gate)
│   │       ├── checkout.tsx            # T-S16 checkout & payment
│   │       └── success.tsx             # T-S17 payment success / receipt + QR
│   ├── pass.tsx                        # T-S18 booking QR / digital pass (modal)
│   ├── lease.tsx                       # T-S19 digital lease agreement (e-sign)
│   ├── billing.tsx                     # T-S21 billing ledger & invoice history
│   ├── visitors.tsx                    # T-S22 visitor access (OTP)
│   ├── support.tsx                     # T-S23 support / maintenance tickets
│   ├── room-swap.tsx                   # T-S24 room swap request
│   ├── move-out.tsx                    # T-S25 move-out / exit + settlement
│   └── notifications.tsx               # T-S26 notifications centre
│
├── src/
│   ├── theme/                          # design tokens (navy + coral marketplace palette)
│   │   ├── colors.ts · typography.ts · spacing.ts · shadows.ts · index.ts
│   ├── components/
│   │   ├── ui/                         # 20 reusable primitives (shared with owner app)
│   │   ├── domain/                     # ListingCard, RoomBedSelector, Badges, Rows, …
│   │   └── illustrations/              # Brand + Onboarding + EmptyStates (SVG)
│   ├── data/                           # mock data + TypeScript domain model
│   │   ├── types.ts                    # all interfaces
│   │   ├── listings.ts                 # 10 listings w/ floors→rooms→beds, reviews, food
│   │   ├── discovery.ts                # curated rails, promos, filter options
│   │   ├── booking.ts                  # active booking, lease, invoices, visitors, tickets
│   │   ├── user.ts · notifications.ts · images.ts · index.ts
│   ├── store/saved.ts                  # cross-screen saved/shortlist store
│   ├── hooks/useCountUp.ts
│   └── lib/                            # format.ts (INR/dates) · haptics.ts · session.ts
│
├── assets/images/                      # icon, splash, adaptive icon (navy, from logo-mark.png)
├── app.json · babel.config.js · tsconfig.json · package.json
```

---

## 🎨 Design system

| Token | Where | Notes |
|---|---|---|
| **Color** | `src/theme/colors.ts` | Brand navy `#01264E`; action coral `#FF4B3E`; cool-grey surfaces `#F5F6F8`; semantic success/warning/info/danger; bed-status legend. |
| **Type** | `src/theme/typography.ts` | Inter `400/500/600/700/800`; `display → overline`; money uses `tabular-nums`. |
| **Spacing/Radius** | `src/theme/spacing.ts` | 4dp grid; radius `sm 8 → sheet 24`, pills full. |
| **Elevation** | `src/theme/shadows.ts` | Flat by default; soft shadow for floating cards/sheets/map. |

**Color logic:** navy is the *brand/trust* color (splash, landing, hero overlays, active tabs,
QR pass, price text); coral is the *action* color (primary CTAs, selected states, hearts,
key highlights). Semantic colors carry status everywhere else.

### Reusable UI primitives (`src/components/ui`)
`Text` · `Button` · `Card` · `Badge` · `Chip` · `Avatar` · `Input` · `SearchBar` ·
`SegmentedControl` · `ProgressBar` · `ProgressRing` · `Sheet` · `Skeleton` · `ScreenHeader` ·
`EmptyState` · `Stepper` · `ListRow` · `IconButton` · `Divider` · `PressableScale`.

### Domain components (`src/components/domain`)
`ListingCard` / `ListingRailCard` · `RoomBedSelector` (`BedLegend`/`SelectableBed`/`SelectableRoom`) ·
`VerifiedBadge` / `PgfyScore` / `RatingPill` / `StatusPill` · `ReviewCard` · `InvoiceRow` ·
`VisitorCard` · `TicketRow` · `NotificationRow` · `SectionHeader`.

---

## 🧩 Mock data
All under `src/data`, fully typed. **10 listings** across Bengaluru localities, each with
floors → rooms → beds, pricing tiers, certificates/PGfy score, reviews, food menus, nearby
places and rating breakdowns. One active booking drives the post-booking dashboard, lease,
invoices, visitors and tickets — kept internally consistent. Dates are anchored to a fixed
`NOW` (2026-05-29) for deterministic relative times.

---

## 📱 Cross-platform notes
- **Safe areas:** every screen pads `useSafeAreaInsets().top`; tab bar, sticky footers and
  sheets pad `insets.bottom`. Android `edgeToEdgeEnabled`; iOS notch + home indicator handled.
- **Navigation:** `expo-router` Stack + 4 bottom tabs. Transient flows (sort, sign, pay,
  visitor OTP, ticket detail) are bottom **sheets**; full-screen flows (search, pass) are modals.
- **New Architecture** enabled (SDK 54 default); **Reanimated 4.1.1 + Worklets 0.5.1** pinned
  to match the Expo Go runtime (avoids `Exception in HostFunction`); `babel-preset-expo` is a
  top-level devDependency (avoids `Cannot find module 'babel-preset-expo'`).

---

## 🖼 Assets & credits
- **App icon / splash / adaptive icon** generated from `logo-mark.png` (navy) via ImageMagick.
- **Illustrations** are original themed SVGs in `src/components/illustrations`.
- **Demo photos** hot-linked from Unsplash & Pexels (free, commercial-OK); **avatars** from
  pravatar — see `src/data/images.ts`. These need a network connection to render; swap for
  bundled local assets for a fully offline demo. See `CREDITS.md`.

---

## 🔧 Tech stack
Expo SDK 54 · React Native 0.81 · React 19 · expo-router 6 · TypeScript (strict) ·
react-native-reanimated 4.1.1 · react-native-worklets 0.5.1 · react-native-gesture-handler ·
react-native-svg · expo-image · expo-linear-gradient · expo-haptics ·
@expo-google-fonts/inter · @react-native-async-storage/async-storage.



export APP_ENV=production
export NODE_ENV=production

# regenerate native projects with prod values baked in
npx expo prebuild --platform android
npx expo prebuild --platform ios

# Android
cd android
./gradlew --stop
./gradlew bundleRelease      # AAB, for Play Store
./gradlew assembleRelease    # APK
cd ..

# iOS — CLI archive inherits the exported env since it's a child process of this shell
xcodebuild archive \
  -workspace ios/PGfyDev.xcworkspace \
  -scheme PGfyDev \
  -configuration Release \
  -archivePath build/PGfyDev.xcarchive