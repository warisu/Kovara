# @kovara/contracts

> Soroban smart contracts powering the Kōvara protocol — price submission, peer verification, reward distribution, and daily index aggregation — all written in Rust and deployed on the Stellar Network.

[![Network: Stellar](https://img.shields.io/badge/Network-Stellar-5D4ED3)](https://stellar.org)
[![Soroban SDK](https://img.shields.io/badge/Soroban-SDK%200.10-orange)](https://soroban.stellar.org)
[![Language: Rust](https://img.shields.io/badge/Language-Rust-CE422B)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

---

## Overview

`@kovara/contracts` contains all four Soroban smart contracts that form the on-chain backbone of the Kōvara protocol. Each contract has a single, clearly scoped responsibility and communicates with the others via cross-contract calls where necessary.

| Contract | Description |
|---|---|
| `PriceVault` | Stores raw price submissions keyed by country, category, and timestamp |
| `SentinelPool` | Manages verifier staking, vote casting, quorum resolution, and slashing |
| `FlowRewards` | Holds the reward treasury and releases XLM / Stellar USDC to contributors |
| `KovaraIndex` | Aggregates verified prices into the daily KVI (Kōvara Value Index) per country |

---

## Directory Structure

```
contracts/
├── src/
│   ├── price_vault.rs          # PriceVault contract
│   ├── sentinel_pool.rs        # SentinelPool contract
│   ├── flow_rewards.rs         # FlowRewards contract
│   ├── kovara_index.rs         # KovaraIndex contract
│   └── types.rs                # Shared types, enums, error codes
├── tests/
│   ├── price_vault_test.rs
│   ├── sentinel_pool_test.rs
│   ├── flow_rewards_test.rs
│   └── kovara_index_test.rs
├── scripts/
│   ├── deploy_testnet.sh       # Deploy all contracts to Testnet
│   ├── deploy_mainnet.sh       # Deploy to Mainnet (requires multisig)
│   └── seed_testnet.sh         # Seed Testnet with sample submissions
├── Cargo.toml
└── README.md                   ← you are here
```

---

## Contract Details

### `PriceVault`

The entry point for all price submissions. Stores raw, unverified prices on-ledger and emits events consumed by the `@kovara/sentinel` oracle daemon.

**Storage keys:**
```
submission:{country_iso}:{category}:{submitter_address}:{timestamp}
```

**Interface:**

```rust
// Submit a new price entry
fn submit(
    env: Env,
    submitter: Address,
    country_iso: Symbol,
    category: Symbol,
    price_usd_cents: u64,
    currency_local: Symbol,
    price_local: u64,
) -> Result<u64, Error>;   // returns submission_id

// Read a single submission
fn get_submission(env: Env, submission_id: u64) -> Option<Submission>;

// Read all pending (unverified) submissions for a country
fn pending(env: Env, country_iso: Symbol) -> Vec<Submission>;
```

**Events emitted:**
- `PriceSubmitted { submission_id, submitter, country_iso, category, timestamp }`

---

### `SentinelPool`

Controls the peer-verification layer. Verifiers stake XLM to participate. Each submission requires a quorum of `N` votes (default: 3) before being considered verified. Bad actors who vote against consensus lose a portion of their stake.

**Interface:**

```rust
// Stake XLM to join the verifier pool
fn stake(env: Env, verifier: Address, amount: i128) -> Result<(), Error>;

// Cast a verification vote on a submission
fn vote(
    env: Env,
    verifier: Address,
    submission_id: u64,
    verdict: Verdict,   // Approve | Reject
) -> Result<(), Error>;

// Resolve quorum for a submission (called by Sentinel Node)
fn resolve(env: Env, submission_id: u64) -> Resolution;

// Withdraw stake (subject to unbonding period)
fn unstake(env: Env, verifier: Address) -> Result<i128, Error>;
```

**Slashing rules:**
- Vote in the minority on a resolved submission → lose 5% of stake
- Vote on 10+ submissions in the minority in 30 days → stake frozen pending review

---

### `FlowRewards`

Holds the protocol's reward treasury (XLM + Stellar USDC). Releases rewards after the `SentinelPool` resolves a submission. Only callable by `SentinelPool` and `KovaraIndex` via cross-contract calls.

**Interface:**

```rust
// Pay a contributor after a verified submission
fn pay_submitter(
    env: Env,
    recipient: Address,
    submission_id: u64,
) -> Result<(), Error>;

// Pay a verifier after a resolved vote
fn pay_verifier(
    env: Env,
    recipient: Address,
    submission_id: u64,
) -> Result<(), Error>;

// Top up the treasury (governance / B2B licensing inflow)
fn fund(env: Env, funder: Address, amount: i128, asset: Asset) -> Result<(), Error>;

// Read current treasury balances
fn balances(env: Env) -> TreasuryBalance;
```

**Reward rates (configurable via governance):**

| Action | Default rate |
|---|---|
| Verified submission | 0.05 XLM |
| Correct verifier vote | 0.02 USDC |
| Oracle node daily aggregation | 2 XLM |

---

### `KovaraIndex`

Invoked once per day by the `@kovara/sentinel` oracle daemon. Reads all submissions verified within the past 24 hours, computes the trimmed median per category per country, and writes the resulting KVI snapshot on-chain.

**Interface:**

```rust
// Aggregate and publish the daily index (sentinel nodes only)
fn update_index(
    env: Env,
    caller: Address,
    country_iso: Symbol,
    date: u64,                 // Unix timestamp (UTC midnight)
) -> Result<KviSnapshot, Error>;

// Read the latest index for a country
fn latest(env: Env, country_iso: Symbol) -> Option<KviSnapshot>;

// Read a historical snapshot
fn history(
    env: Env,
    country_iso: Symbol,
    from: u64,
    to: u64,
) -> Vec<KviSnapshot>;
```

**Aggregation methodology:**
1. Collect all submissions for `country_iso` verified in the last 24h
2. Group by `category`
3. Apply 10% trimmed mean (drop top and bottom 10% of values)
4. Convert all values to USD cents using Stellar DEX price feeds
5. Compute composite KVI score (weighted basket average)
6. Write `KviSnapshot` to ledger storage

---

## Local Development

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Soroban CLI
cargo install --locked soroban-cli

# Add wasm32 target
rustup target add wasm32-unknown-unknown
```

### Build

```bash
# From the contracts/ directory
cargo build --target wasm32-unknown-unknown --release
```

Or use the workspace-level build:

```bash
# From repo root
pnpm turbo build --filter=@kovara/contracts
```

### Test

```bash
cargo test
```

Tests run against the Soroban sandbox (no live network required).

### Deploy to Testnet

```bash
# Set your Testnet keypair
export KOVARA_DEPLOYER_SECRET=S...

bash scripts/deploy_testnet.sh
```

The script deploys all four contracts in dependency order and writes their addresses to `deployed/testnet.json`.

### Deploy to Mainnet

Mainnet deployment requires a 2-of-3 multisig from the Kōvara core team. See [docs/deployment.md](../../docs/deployment.md).

---

## Contract Addresses

| Network | Contract | Address |
|---|---|---|
| Testnet | PriceVault | `GCPV...` |
| Testnet | SentinelPool | `GCSP...` |
| Testnet | FlowRewards | `GCFR...` |
| Testnet | KovaraIndex | `GCKI...` |
| Mainnet | All | TBD — launching Q3 2025 |

---

## Audits

| Auditor | Scope | Date | Report |
|---|---|---|---|
| TBD | All contracts | Q2 2025 | [audits/](../../audits/) |

---

## Error Codes

| Code | Name | Description |
|---|---|---|
| `1001` | `Unauthorized` | Caller is not permitted for this action |
| `1002` | `AlreadySubmitted` | Duplicate submission within cooldown window |
| `1003` | `QuorumNotReached` | Insufficient votes to resolve |
| `1004` | `InsufficientStake` | Verifier stake below minimum threshold |
| `1005` | `TreasuryEmpty` | Reward pool has insufficient funds |
| `1006` | `InvalidCountry` | Unrecognised ISO country code |
| `1007` | `InvalidCategory` | Unrecognised price basket category |

---

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md). For contract-specific changes, all PRs must include:

- Unit tests covering the changed logic
- A brief description of any storage schema changes
- Gas usage benchmarks if the change affects hot paths

---

## License

MIT © 2025 Kōvara Contributors