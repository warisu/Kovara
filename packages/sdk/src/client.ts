import {
  rpc,
  Contract,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  Account,
  Keypair,
  xdr,
} from "@stellar/stellar-sdk";
import { Profile, Post, Pool } from "./types";
import { mapError } from "./errors";

const { isSimulationError, isSimulationSuccess } = rpc.Api;

const DEFAULT_NETWORK = "Test SDF Network ; September 2015";
const DEFAULT_TIMEOUT = 30;

function scvAddress(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "address" });
}

function scvString(value: string): xdr.ScVal {
  return nativeToScVal(value);
}

function scvU64(value: number): xdr.ScVal {
  return nativeToScVal(value);
}

function scvI128(value: number | bigint): xdr.ScVal {
  return nativeToScVal(value);
}

/**
 * Configuration options for the SDK client
 */
export interface ClientConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase?: string;
}

/**
 * Typed client for all Kovara social contract methods.
 *
 * Read methods call simulateTransaction on the Soroban RPC.
 * Write methods return a base64-encoded XDR transaction envelope
 * ready to be signed and submitted by the caller.
 *
 * This client is wired to the Soroban contract bindings from
 * packages/contracts/src/index.ts — regenerate that file after
 * every contract change with:
 *
 *   pnpm build:contracts && bash packages/sdk/generate.sh
 */
export class KovaraClient {
  private contractId: string;
  private rpcUrl: string;
  private networkPassphrase: string;

  constructor(config: ClientConfig) {
    this.contractId = config.contractId;
    this.rpcUrl = config.rpcUrl;
    this.networkPassphrase = config.networkPassphrase || DEFAULT_NETWORK;
  }

  private async simulateCall(method: string, ...args: xdr.ScVal[]): Promise<xdr.ScVal | null> {
    const server = new rpc.Server(this.rpcUrl);
    const contract = new Contract(this.contractId);
    const op = contract.call(method, ...args);

    const source = Keypair.random();
    const account = new Account(source.publicKey(), "0");
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(DEFAULT_TIMEOUT)
      .build();

    const result = await server.simulateTransaction(tx);

    if (isSimulationError(result)) {
      throw mapError(result.error);
    }
    if (!isSimulationSuccess(result) || !result.result) return null;

    return result.result.retval;
  }

  private buildTx(method: string, ...args: xdr.ScVal[]): string {
    const contract = new Contract(this.contractId);
    const op = contract.call(method, ...args);

    const source = Keypair.random();
    const account = new Account(source.publicKey(), "0");
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(op)
      .setTimeout(DEFAULT_TIMEOUT)
      .build();

    return tx.toEnvelope().toXDR("base64");
  }

  // ── Read: Profiles ──────────────────────────────────────────────────────────

  async getProfile(address: string): Promise<Profile | null> {
    const retval = await this.simulateCall("get_profile", scvAddress(address));
    if (!retval) return null;
    const raw = scValToNative(retval);
    if (raw == null) return null;
    return raw as Profile;
  }

  async getPost(postId: number): Promise<Post | null> {
    const retval = await this.simulateCall("get_post", scvU64(postId));
    if (!retval) return null;
    const raw = scValToNative(retval);
    if (raw == null) return null;
    return raw as Post;
  }

  async getPostCount(): Promise<number> {
    const retval = await this.simulateCall("get_post_count");
    if (!retval) return 0;
    return Number(scValToNative(retval));
  }

  /**
   * Returns a paginated list of post IDs for an author.
   * offset and limit follow the same rules as the on-chain contract:
   * limit must be between 1 and 50 (inclusive).
   */
  async getPostsByAuthor(author: string, offset: number, limit: number): Promise<number[]> {
    const retval = await this.simulateCall(
      "get_posts_by_author",
      scvAddress(author),
      nativeToScVal(offset, { type: "u32" }),
      nativeToScVal(limit, { type: "u32" })
    );
    if (!retval) return [];
    return scValToNative(retval) as number[];
  }

  async getFollowing(address: string): Promise<string[]> {
    const retval = await this.simulateCall("get_following", scvAddress(address));
    if (!retval) return [];
    return scValToNative(retval) as string[];
  }

  async getFollowers(address: string): Promise<string[]> {
    const retval = await this.simulateCall("get_followers", scvAddress(address));
    if (!retval) return [];
    return scValToNative(retval) as string[];
  }

  async getPool(poolId: string): Promise<Pool | null> {
    const retval = await this.simulateCall("get_pool", scvString(poolId));
    if (!retval) return null;
    const raw = scValToNative(retval);
    if (raw == null) return null;
    return raw as Pool;
  }

  async getPoolAdmins(poolId: string): Promise<string[]> {
    const retval = await this.simulateCall("get_pool_admins", scvString(poolId));
    if (!retval) return [];
    return scValToNative(retval) as string[];
  }

  async getFeeBps(): Promise<number> {
    const retval = await this.simulateCall("get_fee_bps");
    if (!retval) return 0;
    return Number(scValToNative(retval));
  }

  async getTreasury(): Promise<string> {
    const retval = await this.simulateCall("get_treasury");
    if (!retval) return "";
    return scValToNative(retval) as string;
  }

  async hasLiked(address: string, postId: number): Promise<boolean> {
    const retval = await this.simulateCall("has_liked", scvAddress(address), scvU64(postId));
    if (!retval) return false;
    return scValToNative(retval) as boolean;
  }

  async isBlocked(blocker: string, blocked: string): Promise<boolean> {
    const retval = await this.simulateCall("is_blocked", scvAddress(blocker), scvAddress(blocked));
    if (!retval) return false;
    return scValToNative(retval) as boolean;
  }

  async getLikeCount(postId: number): Promise<number> {
    const retval = await this.simulateCall("get_like_count", scvU64(postId));
    if (!retval) return 0;
    return Number(scValToNative(retval));
  }

  // ── Write: returns base64 XDR envelope for caller to sign + submit ──────────

  createPost(author: string, content: string): string {
    return this.buildTx("create_post", scvAddress(author), scvString(content));
  }

  deletePost(author: string, postId: number): string {
    return this.buildTx("delete_post", scvAddress(author), scvU64(postId));
  }

  follow(follower: string, followed: string): string {
    return this.buildTx("follow", scvAddress(follower), scvAddress(followed));
  }

  unfollow(follower: string, followed: string): string {
    return this.buildTx("unfollow", scvAddress(follower), scvAddress(followed));
  }

  like(liker: string, postId: number): string {
    return this.buildTx("like", scvAddress(liker), scvU64(postId));
  }

  unlike(liker: string, postId: number): string {
    return this.buildTx("unlike", scvAddress(liker), scvU64(postId));
  }

  tip(sender: string, postId: number, amount: number | bigint): string {
    return this.buildTx("tip", scvAddress(sender), scvU64(postId), scvI128(amount));
  }

  createPool(admin: string, token: string, initialAdmins: string[], threshold: number): string {
    return this.buildTx(
      "create_pool",
      scvAddress(admin),
      scvString(token),
      nativeToScVal(
        initialAdmins.map((a) => scvAddress(a)),
        { type: "vec" }
      ),
      scvU64(threshold)
    );
  }

  deposit(depositor: string, poolId: string, token: string, amount: number | bigint): string {
    return this.buildTx(
      "deposit",
      scvAddress(depositor),
      scvString(poolId),
      scvString(token),
      scvI128(amount)
    );
  }

  withdraw(signers: string[], poolId: string, amount: number | bigint, recipient: string): string {
    return this.buildTx(
      "withdraw",
      nativeToScVal(
        signers.map((s) => scvAddress(s)),
        { type: "vec" }
      ),
      scvString(poolId),
      scvI128(amount),
      scvAddress(recipient)
    );
  }

  setProfile(user: string, username: string, creatorToken: string): string {
    return this.buildTx(
      "set_profile",
      scvAddress(user),
      scvString(username),
      scvAddress(creatorToken)
    );
  }

  block(blocker: string, blocked: string): string {
    return this.buildTx("block", scvAddress(blocker), scvAddress(blocked));
  }

  unblock(blocker: string, blocked: string): string {
    return this.buildTx("unblock", scvAddress(blocker), scvAddress(blocked));
  }
}
