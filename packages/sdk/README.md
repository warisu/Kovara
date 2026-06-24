# Kovara SDK

Typed TypeScript client for the Kovara Soroban smart contract on Stellar.

**npm**: [`Kovara-sdk`](https://www.npmjs.com/package/Kovara-sdk)

---

## Installation

```bash
# npm
npm install Kovara-sdk

# pnpm
pnpm add Kovara-sdk

# yarn
yarn add Kovara-sdk
```

---

## Quick Start

### 1. Instantiate the client

```ts
import { KovaraClient } from "Kovara-sdk";

const client = new KovaraClient({
  contractId: "CABC...XYZ",          // deployed contract address (C...)
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});
```

For Mainnet:

```ts
const client = new KovaraClient({
  contractId: "CABC...XYZ",
  networkPassphrase: "Public Global Stellar Network ; September 2015",
  rpcUrl: "https://soroban-mainnet.stellar.org",
});
```

---

## API Reference

### Profiles

```ts
// Fetch a user profile
const profile = await client.getProfile("GABC...XYZ");
// profile: { address, username, creator_token } | null

// Get total profile count
const count = await client.getProfileCount(); // bigint
```

### Posts

```ts
// Fetch a single post by ID
const post = await client.getPost(1n);
// post: { id, author, content, tip_total, timestamp, like_count } | null

// Total posts ever created (never decrements on delete)
const total = await client.getPostCount(); // bigint

// Paginated post IDs for an author (offset/limit, max 50 per page)
const postIds = await client.getPostsByAuthor("GABC...XYZ", 0, 20);
// postIds: bigint[]   — iterate to fetch each post via getPost()

// Like count for a post
const likes = await client.getLikeCount(1n); // bigint

// Check if an address has liked a post
const liked = await client.hasLiked("GABC...XYZ", 1n); // boolean
```

#### Paginating all posts by an author

```ts
const PAGE_SIZE = 20;
let offset = 0;
let page: bigint[];

do {
  page = await client.getPostsByAuthor(authorAddress, offset, PAGE_SIZE);
  for (const id of page) {
    const post = await client.getPost(id);
    console.log(post?.content);
  }
  offset += PAGE_SIZE;
} while (page.length === PAGE_SIZE);
```

### Social Graph

```ts
// Who is this address following? (paginated, max 50)
const following = await client.getFollowing("GABC...XYZ", 0, 50);

// Who follows this address? (paginated, max 50)
const followers = await client.getFollowers("GABC...XYZ", 0, 50);

// Check block status
const blocked = await client.isBlocked("GABC...blocker", "GABC...blocked"); // boolean
```

### Community Pools

```ts
// Fetch a pool by ID
const pool = await client.getPool("pool_a");
// pool: { token, balance, admins, threshold } | null
```

### Fee & Treasury

```ts
// Platform fee in basis points (e.g. 500 = 5%)
const feeBps = await client.getFeeBps(); // number

// Treasury address
const treasury = await client.getTreasury(); // string | null
```

---

## Usage in Web (Next.js / React)

```ts
// lib/kovara.ts
import { KovaraClient } from "Kovara-sdk";

export const kovara = new KovaraClient({
  contractId: process.env.NEXT_PUBLIC_CONTRACT_ID!,
  networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
});
```

```tsx
// app/profile/[address]/page.tsx
import { kovara } from "@/lib/kovara";

export default async function ProfilePage({ params }: { params: { address: string } }) {
  const profile = await kovara.getProfile(params.address);
  if (!profile) return <p>Profile not found</p>;
  return <h1>@{profile.username}</h1>;
}
```

---

## Usage in React Native / Mobile

```ts
import { KovaraClient } from "Kovara-sdk";

const client = new KovaraClient({
  contractId: "CABC...XYZ",
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});

// Inside a hook or effect
const post = await client.getPost(BigInt(postId));
```

---

## Types

```ts
import type { Post, Profile, Pool } from "Kovara-sdk";

// Post
interface Post {
  id: bigint;
  author: string;
  content: string;
  tip_total: bigint;
  timestamp: bigint;
  like_count: bigint;
}

// Profile
interface Profile {
  address: string;
  username: string;
  creator_token: string;
}

// Pool
interface Pool {
  token: string;
  balance: bigint;
  admins: string[];
  threshold: number;
}
```

---

## Regenerating the client

Run after every contract change:

```bash
# 1. Rebuild the contract
pnpm build:contracts

# 2. Regenerate TypeScript bindings
bash packages/sdk/generate.sh

# 3. Build the SDK package
pnpm --filter sdk build
```

---

## Building for distribution

```bash
pnpm --filter sdk build
# Outputs JavaScript + type declarations to dist/
```

Automated on every `sdk/v*` tag push via `.github/workflows/publish-sdk.yml`.

---

## Prerequisites

To regenerate from the compiled contract WASM:

- Stellar CLI: `cargo install --locked stellar-cli`
- Contract built: `pnpm build:contracts`

To build or use the SDK:

- Node.js ≥ 18
- pnpm (or npm/yarn)
