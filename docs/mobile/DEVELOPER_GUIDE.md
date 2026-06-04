# @kovara/atlas — Mobile App

> The Kōvara contributor app and index explorer. Submit local prices, verify peers, track your XLM and USDC earnings, and browse the daily KVI — all from your phone, powered by your Stellar wallet.

[![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)](https://www.typescriptlang.org)
[![Stellar SDK](https://img.shields.io/badge/@stellar%2Fstellar--sdk-12.x-7B2FBE)](https://github.com/stellar/js-stellar-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

---

## Overview

Atlas is the primary user-facing app for the Kōvara network. It is designed to work on low-end Android devices with intermittent connectivity — a deliberate choice to maximise participation from contributors in the Global South where cost-of-living data is most needed and least available.

**Core flows:**
- Connect a Stellar wallet (LOBSTR, Freighter mobile, or xBull)
- Submit a local price for any basket item in under 30 seconds
- Verify peer submissions and earn USDC for correct votes
- Track cumulative XLM + USDC earnings with a full transaction history
- Explore the live KVI map by country and drill into basket breakdowns

---

## Directory Structure

```
packages/atlas/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx           # Home — live KVI map
│   │   ├── submit.tsx          # Price submission flow
│   │   ├── verify.tsx          # Peer verification queue
│   │   └── rewards.tsx         # Earnings dashboard
│   ├── country/
│   │   └── [iso].tsx           # Country detail page
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   └── connect-wallet.tsx
│   └── _layout.tsx             # Root layout + auth guard
├── components/
│   ├── KviMap/                 # Global choropleth map
│   ├── PriceForm/              # Submission wizard (multi-step)
│   ├── VerifyCard/             # Single verification item
│   ├── RewardsTicker/          # Live earnings counter
│   ├── BasketBreakdown/        # Category bar chart
│   └── WalletBadge/            # Connected wallet indicator
├── lib/
│   ├── stellar.ts              # Wallet connection + signing
│   ├── api.ts                  # @kovara/api REST client
│   ├── contracts.ts            # Soroban contract clients
│   ├── storage.ts              # AsyncStorage helpers
│   └── format.ts               # Currency + number formatters
├── hooks/
│   ├── useWallet.ts            # Wallet state + session
│   ├── useKvi.ts               # KVI data fetching
│   ├── useSubmit.ts            # Submission flow logic
│   └── useRewards.ts           # Earnings polling
├── store/
│   └── index.ts                # Zustand global store
├── assets/
│   ├── fonts/
│   └── icons/
├── app.json
├── eas.json                    # Expo Application Services config
├── .env.example
├── package.json
└── README.md                   ← you are here
```

---

## Screens

### Home — KVI Map

The landing screen shows a world map shaded by KVI score (purchasing power). Tap any country to open its detail page.

- Choropleth map via `react-native-maps` + GeoJSON overlay
- Colour scale: dark purple (low purchasing power) → teal (high)
- Bottom sheet: top 5 countries by today's KVI score
- Refreshes every 5 minutes in the background

### Submit — Price Entry Flow

A guided 4-step wizard that keeps the submission time under 30 seconds:

```
Step 1 → Select category       (Food / Rent / Transport / Utilities / Healthcare)
Step 2 → Select item           (e.g. Bread loaf, 1BR city centre)
Step 3 → Enter price + currency (auto-detects local currency from device locale)
Step 4 → Confirm + sign tx     (wallet signs the Soroban transaction)
```

- Offline-first: submissions drafted locally and queued for when connectivity returns
- Camera shortcut on Step 3 for scanning a receipt (OCR via Google ML Kit)
- Shows estimated XLM reward before confirmation

### Verify — Peer Queue

Lists open submissions from other contributors awaiting peer verification. Each card shows:
- Item, country, and submitted price
- A map pin of the submitter's general region (not exact location)
- Approve / Reject buttons
- Estimated USDC reward for a correct vote

Verifiers see only submissions from countries they have opted into. Swipe left to skip, swipe right to open the full verification card.

### Rewards — Earnings Dashboard

Displays cumulative and per-session earnings with a full breakdown:

- Total XLM earned (from submissions)
- Total USDC earned (from verifications)
- Daily earnings sparkline (last 30 days)
- Transaction history (links to Stellar Expert)
- Withdraw / send buttons (opens native Stellar wallet)

### Country Detail

Drill into any country's KVI history:

- 90-day KVI score line chart
- Basket breakdown by category (bar chart)
- Recent verified submissions table
- Top contributors in that country

---

## Wallet Integration

Atlas supports three Stellar wallet providers:

| Wallet | Method | Platform |
|---|---|---|
| LOBSTR | WalletConnect v2 | iOS + Android |
| xBull | Deep link + callback | Android |
| Freighter Mobile | WalletConnect v2 | iOS + Android |

Wallet sessions are stored encrypted in `expo-secure-store`. The app never holds private keys — all transactions are signed inside the user's wallet app and returned via callback.

```typescript
// lib/stellar.ts

import { WalletConnectAllowedMethods } from '@lobstr-co/lobstr-wc'

export async function connectWallet(): Promise<string> {
  // Opens wallet selector bottom sheet
  // Returns the user's public key on success
}

export async function signTransaction(xdr: string): Promise<string> {
  // Sends XDR to the connected wallet for signing
  // Returns the signed XDR
}
```

---

## Environment Variables

```env
# .env (copy from .env.example)

EXPO_PUBLIC_API_URL=https://api.kovara.io/v1
EXPO_PUBLIC_GRAPHQL_URL=https://api.kovara.io/graphql
EXPO_PUBLIC_STELLAR_NETWORK=testnet               # testnet | mainnet
EXPO_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org

EXPO_PUBLIC_PRICE_VAULT_CONTRACT=GCPV...
EXPO_PUBLIC_KOVARA_INDEX_CONTRACT=GCKI...

EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=your_wc_project_id
EXPO_PUBLIC_SENTRY_DSN=https://...               # Optional crash reporting
```

---

## Local Development

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode 15+ (macOS only)
- Android: Android Studio with an emulator or a physical device

### Install & Run

```bash
cd packages/atlas

# Install dependencies
pnpm install

# Start the Expo dev server
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

### Running Against Testnet

Set `EXPO_PUBLIC_STELLAR_NETWORK=testnet` in your `.env` and use a funded Testnet wallet. Get test XLM from [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator).

---

## Building for Production

Atlas uses [Expo Application Services (EAS)](https://expo.dev/eas) for builds and OTA updates.

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build for Android (APK for testing)
eas build --platform android --profile preview

# Build for Android (AAB for Play Store)
eas build --platform android --profile production

# Build for iOS (IPA for App Store)
eas build --platform ios --profile production

# Push an OTA update (no store review needed)
eas update --branch production --message "Fix price submission on Android 13"
```

Build profiles are defined in `eas.json`.

---

## Offline Support

Atlas is designed to degrade gracefully with no or intermittent connectivity:

| Feature | Offline behaviour |
|---|---|
| KVI map | Shows last cached snapshot (timestamp shown) |
| Submit price | Drafts saved locally; queued for upload on reconnect |
| Verify queue | Last fetched queue available; voting requires connectivity |
| Rewards | Cached balance shown; live sync on reconnect |

Offline queue is managed via `@tanstack/react-query` with `expo-sqlite` as the persistence layer.

---

## Key Dependencies

| Package | Purpose |
|---|---|
| `expo` ~51 | Cross-platform runtime |
| `expo-router` | File-based navigation |
| `@stellar/stellar-sdk` | Stellar + Soroban transaction building |
| `@walletconnect/modal-react-native` | WalletConnect v2 integration |
| `@tanstack/react-query` | Data fetching, caching, sync |
| `zustand` | Lightweight global state |
| `react-native-maps` | KVI choropleth map |
| `@shopify/flash-list` | High-performance verify queue list |
| `expo-secure-store` | Encrypted wallet session storage |
| `expo-sqlite` | Offline queue persistence |
| `victory-native` | Earnings charts + basket breakdowns |
| `react-native-vision-camera` | Receipt OCR (price entry shortcut) |
| `@sentry/react-native` | Crash reporting |

---

## Testing

```bash
# Unit tests (Jest + Testing Library)
pnpm test

# Watch mode
pnpm test:watch

# E2E tests (Detox)
pnpm test:e2e:android
pnpm test:e2e:ios
```

E2E tests run against a local Testnet environment seeded with fixture data. See [docs/testing.md](../../docs/testing.md) for setup.

---

## Accessibility

Atlas targets WCAG 2.1 AA compliance and is tested against:
- Android TalkBack
- iOS VoiceOver
- Dynamic font sizes (system large text settings)

All interactive elements have `accessibilityLabel` and `accessibilityRole` props. The KVI map includes a data table fallback for screen reader users.

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md). For mobile-specific contributions:

- Match existing component patterns in `components/`
- Test on a real Android device — emulators miss WalletConnect deep link behaviour
- Run `pnpm lint` and `pnpm test` before opening a PR
- Include screenshots or screen recordings for UI changes

Good first issues: [`label:good-first-issue label:mobile`](https://github.com/kovara-protocol/kovara/issues?q=label%3Agood-first-issue+label%3Amobile)

---

## License

MIT © 2025 Kōvara Contributors