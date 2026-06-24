# Kovara-sdk

Typed TypeScript client for `KovaraContract`, generated from the compiled contract WASM using `stellar contract bindings typescript`.

**npm**: [`Kovara-sdk`](https://www.npmjs.com/package/Kovara-sdk)

## Quick Start

### 1. Install

```bash
# npm
npm install Kovara-sdk

# pnpm
pnpm add Kovara-sdk

# yarn
yarn add Kovara-sdk
```

### 2. Instantiate the client

```ts
import { Client } from "Kovara-sdk";

const client = new Client({
  contractId: "C...", // deployed KovaraContract address
  networkPassphrase: "Test SDF Network ; September 2015",
  rpcUrl: "https://soroban-testnet.stellar.org",
});
```

### 3. Call contract functions

```ts
// Read a post
const post = await client.get_post({ id: 1n });
console.log(post.result);

// Create a post (requires auth)
const tx = await client.create_post(
  { author: keypair.publicKey(), content: "Hello Kovara!" },
  { fee: 100 }
);
await tx.signAndSend({ signTransaction: keypair.sign.bind(keypair) });
```

### 4. Simulate before sending

```ts
// Simulate to estimate fees before committing
const simResult = await client.tip(
  { tipper: myAddress, post_id: 1n, token: xlmAddress, amount: 1_000_000n },
  { simulate: true }
);
console.log("estimated fee:", simResult.simulationData?.minResourceFee);
```

---

## Import Semantics: Browser vs Node.js

The SDK ships a single CommonJS bundle (`dist/index.js`) with accompanying TypeScript
declarations (`dist/index.d.ts`). The examples below cover every common environment.

### Browser (ESM via bundler — Vite, webpack, Next.js, etc.)

Modern bundlers resolve the `"exports"` field in `package.json` and tree-shake unused exports automatically.

```ts
// Any modern bundler will resolve this to the correct dist file.
import { KovaraClient } from "Kovara-sdk";

const client = new KovaraClient({
  contractId: "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  rpcUrl: "https://soroban-testnet.stellar.org",
  networkPassphrase: "Test SDF Network ; September 2015",
});

const post = await client.get_post({ id: 1n });
console.log(post.result?.content);
```

> **Note on BigInt**: Soroban `u64`/`i128` values are represented as JavaScript `bigint`.
> Ensure your bundler target supports `BigInt` (ES2020+). In Vite set `target: 'es2020'`
> in `vite.config.ts`; in webpack set `target: 'web'` with `experiments.outputModule: true`.

### Browser (CDN / script tag — no bundler)

The SDK does **not** ship a standalone IIFE or UMD bundle. For no-bundler browser usage,
use a CDN that supports ESM, such as esm.sh or jspm:

```html
<script type="module">
  // esm.sh transpiles npm packages to browser-native ES modules on the fly.
  import { KovaraClient } from "https://esm.sh/Kovara-sdk";

  const client = new KovaraClient({
    contractId: "C...",
    rpcUrl: "https://soroban-testnet.stellar.org",
  });
</script>
```

### Node.js — CommonJS (`require`)

The published `dist/index.js` is a CommonJS module, so it works directly with `require`:

```js
// index.js  (Node.js CJS)
const { KovaraClient } = require("Kovara-sdk");

async function main() {
  const client = new KovaraClient({
    contractId: "C...",
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  });

  const posts = await client.get_posts({ page: 0, limit: 10 });
  console.log(posts.result);
}

main().catch(console.error);
```

### Node.js — ESM (`import`) with TypeScript

When your TypeScript project uses `"module": "ESNext"` or `"module": "NodeNext"` you can use
the standard `import` syntax. The SDK's `"exports"` entry point is resolved automatically.

```ts
// index.ts  (Node.js ESM + TypeScript)
import { KovaraClient, NotFoundError } from "Kovara-sdk";

const client = new KovaraClient({
  contractId: process.env.CONTRACT_ID!,
  rpcUrl: process.env.RPC_URL ?? "https://soroban-testnet.stellar.org",
});

try {
  const profile = await client.get_profile({ address: "G..." });
  console.log(profile.result?.username);
} catch (err) {
  if (err instanceof NotFoundError) {
    console.error("Profile does not exist on-chain yet.");
  } else {
    throw err;
  }
}
```

In `tsconfig.json`, use at least:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "target": "ES2020",
    "esModuleInterop": true
  }
}
```

### Named exports reference

All public symbols are re-exported from the top-level entry point:

| Symbol | Description |
|---|---|
| `KovaraClient` | Main read/write contract client |
| `ClientConfig` | Constructor options type |
| `Profile`, `Post`, `Pool` | On-chain data types |
| `KovaraError` | Base error class |
| `NotFoundError` | Resource not found on-chain |
| `UnauthorizedError` | Caller lacks permission |
| `InsufficientBalanceError` | Insufficient funds or allowance |
| `CooldownError` | Tip cooldown still active |
| `InvalidInputError` | Input failed pre-flight validation |
| `InvalidManifestError` | Mini-app manifest schema violation |
| `validateManifest` | Validate a mini-app manifest object |
| `MiniAppManifest` | Typed mini-app manifest interface |
| `mapError` | Map raw contract errors to typed errors |

---

## API Reference

Full API documentation is published to GitHub Pages. Run locally with:

```bash
pnpm docs
# Opens packages/sdk/docs/index.html
```

## Regenerating the client

Run this after every contract change:

```bash
# 1. Rebuild the contract
pnpm build:contracts

# 2. Regenerate the TypeScript client
bash packages/sdk/generate.sh

# 3. Build the SDK for publishing (outputs to dist/)
pnpm --filter sdk build
```

The generated files are written to `packages/sdk/src/`. Commit them so consumers don't need the Stellar CLI installed.

## Building for distribution

When publishing to npm, build the TypeScript to JavaScript:

```bash
pnpm --filter sdk build
# Outputs JavaScript and type declarations to dist/
```

This step is automated in the GitHub Actions workflow (`publish-sdk.yml`) on every `sdk/v*` tag push.

## Usage

Import the client in the frontend or any other workspace package:

```ts
import { Client } from "sdk";
```

## Prerequisites

To regenerate the client from the compiled contract:

- Stellar CLI: `cargo install --locked stellar-cli`
- Contract built: `pnpm build:contracts`

To build the SDK for distribution, you only need:

- Node.js 18+
- pnpm (or npm/yarn)
