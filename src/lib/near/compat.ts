/**
 * The part of the near-api-js 2.x API this app uses, rebuilt on near-api-js 7.
 *
 * near-api-js 7 takes bigint amounts, has no `Near` connection object and no
 * `Contract(account, id, { viewMethods })` wrapper. Instead of rewriting every
 * caller, this module keeps the 2.x shapes and behaviour the app relies on:
 *
 * - action builders that accept bn.js amounts and encode them as 2.x did;
 * - NEAR amount formatting and base58 helpers with 2.x input handling;
 * - a JSON-RPC provider with the 2.x method set and request shapes
 *   (`query`, `block`, `txStatus`, `validators`, `sendTransaction`);
 * - a read-only account (`state`, `viewFunction`, `getAccountBalance`) and a
 *   contract wrapper for view methods.
 */
import BN from "bn.js";
import {
  type AccountViewRaw,
  type Action,
  type BlockResult,
  type CodeResult,
  type EpochValidatorInfo,
  type FinalExecutionOutcome,
  type NearProtocolConfig,
  type SignedTransaction,
  JsonRpcProvider,
  KeyPairEd25519,
  PositionalArgsError,
  actions,
  baseDecode,
  baseEncode,
} from "near-api-js";
import { TransactionTimeoutError } from "near-api-js/rpc-errors";

// ---------------------------------------------------------------------------
// Amounts and actions
// ---------------------------------------------------------------------------

export type BNLike = BN | bigint | string | number;

/**
 * Converts an amount to bigint. Numbers go through bn.js first, which is how
 * near-api-js 2.x serialized them.
 */
export function toBigInt(value: BNLike): bigint {
  if (typeof value === "number") return BigInt(new BN(value).toString());
  return BigInt(value.toString());
}

const U64_LIMIT = BigInt(2) ** BigInt(64);
const U128_LIMIT = BigInt(2) ** BigInt(128);

/**
 * near-api-js 2.x refused amounts that did not fit the field; near-api-js 7
 * wraps them silently (a negative deposit becomes a huge one). Keep refusing.
 */
function toUnsigned(value: BNLike, limit: bigint, field: string): bigint {
  const amount = toBigInt(value);
  // bn.js truncates numbers, so -0.5 would otherwise pass as 0.
  const negativeNumber = typeof value === "number" && value < 0;
  if (negativeNumber || amount < BigInt(0) || amount >= limit) {
    throw new RangeError(`${field} is out of range: ${amount.toString()}`);
  }
  return amount;
}

/** Same check as near-api-js 2.x: a Uint8Array or Buffer is sent as raw bytes. */
function isBytes(args: object): args is Uint8Array {
  const maybeBytes = args as Uint8Array;
  return (
    maybeBytes.byteLength !== undefined &&
    maybeBytes.byteLength === maybeBytes.length
  );
}

/** near-api-js 2.x `transactions.functionCall`. */
export function functionCall(
  methodName: string,
  args: object | Uint8Array,
  gas: BNLike = 0,
  deposit: BNLike = 0,
): Action {
  const argBytes = isBytes(args) ? args : Buffer.from(JSON.stringify(args));
  return actions.functionCall(
    methodName,
    argBytes,
    toUnsigned(gas, U64_LIMIT, "gas"),
    toUnsigned(deposit, U128_LIMIT, "deposit"),
  );
}

/** near-api-js 2.x `transactions.transfer`. */
export function transfer(deposit: BNLike = 0): Action {
  return actions.transfer(toUnsigned(deposit, U128_LIMIT, "deposit"));
}

/** Drop-in for `import { transactions } from "near-api-js"` (2.x). */
export const transactions = { functionCall, transfer };

// ---------------------------------------------------------------------------
// NEAR amount formatting (near-api-js 2.x `utils.format`)
// ---------------------------------------------------------------------------

export const NEAR_NOMINATION_EXP = 24;

const ROUNDING_OFFSETS: BN[] = [];
const BN10 = new BN(10);
for (
  let i = 0, offset = new BN(5);
  i < NEAR_NOMINATION_EXP;
  i++, offset = offset.mul(BN10)
) {
  ROUNDING_OFFSETS[i] = offset;
}

/** Formats yoctoNEAR as NEAR, e.g. "1,234.5". `fracDigits` rounds half up. */
export function formatNearAmount(
  balance: string,
  fracDigits = NEAR_NOMINATION_EXP,
): string {
  const balanceBN = new BN(balance, 10);
  if (fracDigits !== NEAR_NOMINATION_EXP) {
    const roundingExp = NEAR_NOMINATION_EXP - fracDigits - 1;
    if (roundingExp > 0) {
      balanceBN.iadd(ROUNDING_OFFSETS[roundingExp]);
    }
  }
  balance = balanceBN.toString();
  const wholeStr =
    balance.substring(0, balance.length - NEAR_NOMINATION_EXP) || "0";
  const fractionStr = balance
    .substring(balance.length - NEAR_NOMINATION_EXP)
    .padStart(NEAR_NOMINATION_EXP, "0")
    .substring(0, fracDigits);
  return trimTrailingZeroes(`${formatWithCommas(wholeStr)}.${fractionStr}`);
}

/** Parses NEAR to yoctoNEAR. Returns null for an empty or missing amount. */
export function parseNearAmount(amt?: string | null): string | null {
  if (!amt) {
    return null;
  }
  amt = amt.replace(/,/g, "").trim();
  const split = amt.split(".");
  const wholePart = split[0];
  const fracPart = split[1] || "";
  if (split.length > 2 || fracPart.length > NEAR_NOMINATION_EXP) {
    throw new Error(`Cannot parse '${amt}' as NEAR amount`);
  }
  return trimLeadingZeroes(
    wholePart + fracPart.padEnd(NEAR_NOMINATION_EXP, "0"),
  );
}

function trimTrailingZeroes(value: string) {
  return value.replace(/\.?0*$/, "");
}

function trimLeadingZeroes(value: string) {
  value = value.replace(/^0+/, "");
  return value === "" ? "0" : value;
}

function formatWithCommas(value: string) {
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(value)) {
    value = value.replace(pattern, "$1,$2");
  }
  return value;
}

// ---------------------------------------------------------------------------
// Encoding and keys
// ---------------------------------------------------------------------------

/** Base58-encodes bytes; a string is encoded as its UTF-8 bytes. */
export function base_encode(value: Uint8Array | string): string {
  return baseEncode(
    typeof value === "string" ? Buffer.from(value, "utf8") : value,
  );
}

/** Base58-decodes to a Buffer. */
export function base_decode(value: string): Buffer {
  return Buffer.from(baseDecode(value));
}

/**
 * Parses an ed25519 secret key like near-api-js 2.x `KeyPair.fromString`:
 * the `ed25519:` prefix is optional, other curves are rejected and the key
 * must be the 64-byte expanded form.
 */
export function keyPairFromString(encodedKey: string): KeyPairEd25519 {
  const parts = encodedKey.split(":");
  if (parts.length === 1) {
    return ed25519KeyPair(parts[0]);
  }
  if (parts.length === 2) {
    if (parts[0].toUpperCase() === "ED25519") {
      return ed25519KeyPair(parts[1]);
    }
    throw new Error(`Unknown curve: ${parts[0]}`);
  }
  throw new Error("Invalid encoded key format, must be <curve>:<encoded key>");
}

function ed25519KeyPair(secretKey: string) {
  if (baseDecode(secretKey).length !== 64) {
    throw new Error("bad secret key size");
  }
  return new KeyPairEd25519(secretKey);
}

// ---------------------------------------------------------------------------
// JSON-RPC provider
// ---------------------------------------------------------------------------

export type Finality = "optimistic" | "near-final" | "final";
export type BlockQuery = { finality: Finality } | { blockId: string | number };
export type QueryParams = { request_type: string; [key: string]: unknown };

// near-api-js 2.x retried an RPC request only when the node answered HTTP 503,
// the request failed at the network level, or the node reported a timeout;
// anything else (HTTP 429, 500, 408, 502, RPC errors) was thrown at once.
// near-api-js 7 also retries 500 and 408, which keeps rate-limited fan-outs
// (for example the staking pool list) pending for minutes. Keep the 2.x rule:
// up to 10 attempts, waiting 1s and then 1.5x longer after each failure.
const RETRY = { attempts: 10, firstWaitMs: 1000, multiplier: 1.5 };

function isRetryableLike2x(error: unknown): boolean {
  // Network failures: fetch rejects with a TypeError ("fetch failed" in
  // Node, "Failed to fetch" in Chromium). Match the error itself, not text,
  // so a contract error quoting these words is not retried.
  if (
    error instanceof TypeError &&
    (error.message === "fetch failed" || error.message === "Failed to fetch")
  ) {
    return true;
  }
  // The node answered with a JSON-RPC timeout (for example
  // `broadcast_tx_commit` still waiting for the outcome). 2.x resent the
  // request; resending the same signed transaction is safe.
  if (error instanceof TransactionTimeoutError) return true;
  // near-api-js 7 reports HTTP failures with the status as `cause`. 2.x only
  // retried 503; a 408 (node timeout) or 429 was thrown at once.
  const { cause } = (error ?? {}) as { cause?: unknown };
  return cause === 503;
}

type SendJsonRpc = (method: string, params: unknown) => Promise<unknown>;

/** A near-api-js 7 provider that retries requests the way 2.x did. */
export function createJsonRpcProvider(url: string): JsonRpcProvider {
  // One attempt per call inside near-api-js; retries happen in the wrapper.
  const provider = new JsonRpcProvider(
    { url },
    { retries: 1, wait: 0, backoff: 1 },
  );
  const singleAttempt = provider.sendJsonRpc.bind(provider) as SendJsonRpc;
  const withRetries: SendJsonRpc = async (method, params) => {
    let wait = RETRY.firstWaitMs;
    for (let attempt = 1; ; attempt++) {
      try {
        return await singleAttempt(method, params);
      } catch (error) {
        if (attempt >= RETRY.attempts || !isRetryableLike2x(error)) throw error;
        await new Promise((resolve) => setTimeout(resolve, wait));
        wait *= RETRY.multiplier;
      }
    }
  };
  // Every provider method goes through `this.sendJsonRpc`.
  (provider as unknown as { sendJsonRpc: SendJsonRpc }).sendJsonRpc =
    withRetries;
  return provider;
}

/** The near-api-js 2.x `JsonRpcProvider` methods this app calls. */
export class NearRpcProvider {
  readonly rpc: JsonRpcProvider;

  constructor({ url }: { url: string }) {
    this.rpc = createJsonRpcProvider(url);
  }

  sendJsonRpc<T>(method: string, params: unknown): Promise<T> {
    const send = this.rpc.sendJsonRpc.bind(this.rpc) as (
      method: string,
      params: unknown,
    ) => Promise<T>;
    return send(method, params);
  }

  /** RPC `query`. Accepts `blockId` as an alias for `block_id`. */
  query<T = unknown>(params: QueryParams): Promise<T> {
    const { block_id, blockId, ...otherParams } = params;
    return this.sendJsonRpc<T>("query", {
      ...otherParams,
      block_id: block_id || blockId,
    });
  }

  block(blockQuery: BlockQuery): Promise<BlockResult> {
    const { finality } = blockQuery as { finality?: Finality };
    const { blockId } = blockQuery as { blockId?: string | number };
    return this.sendJsonRpc("block", { block_id: blockId, finality });
  }

  txStatus(
    txHash: string | Uint8Array,
    accountId: string,
  ): Promise<FinalExecutionOutcome> {
    const hash = typeof txHash === "string" ? txHash : base_encode(txHash);
    return this.sendJsonRpc("tx", [hash, accountId]);
  }

  validators(blockId: string | number | null): Promise<EpochValidatorInfo> {
    return this.sendJsonRpc("validators", [blockId]);
  }

  experimental_protocolConfig(
    blockReference: BlockQuery,
  ): Promise<NearProtocolConfig> {
    const { blockId, ...otherParams } = blockReference as {
      blockId?: string | number;
    };
    return this.sendJsonRpc("EXPERIMENTAL_protocol_config", {
      ...otherParams,
      block_id: blockId,
    });
  }

  /**
   * Broadcasts with `broadcast_tx_commit` and waits for the outcome. A failed
   * execution is reported in the outcome's `status`, it does not throw.
   */
  sendTransaction(
    signedTransaction: SignedTransaction,
  ): Promise<FinalExecutionOutcome> {
    const bytes = Buffer.from(signedTransaction.encode());
    return this.sendJsonRpc("broadcast_tx_commit", [bytes.toString("base64")]);
  }
}

// ---------------------------------------------------------------------------
// Connection, read-only account and contract views
// ---------------------------------------------------------------------------

export type Connection = { networkId: string; provider: NearRpcProvider };

/** Replaces the near-api-js 2.x `Near` object returned by `connect()`. */
export class NearConnection {
  readonly connection: Connection;

  constructor({ networkId, nodeUrl }: { networkId: string; nodeUrl: string }) {
    this.connection = {
      networkId,
      provider: new NearRpcProvider({ url: nodeUrl }),
    };
  }

  /** Makes no RPC request, like 2.x `near.account()`. */
  account(accountId: string): Promise<ReadOnlyAccount> {
    return Promise.resolve(new ReadOnlyAccount(this.connection, accountId));
  }
}

export type AccountBalance = {
  total: string;
  stateStaked: string;
  staked: string;
  available: string;
};

export type ViewFunctionCallOptions = {
  contractId: string;
  methodName: string;
  args?: object;
  parse?: (response: Uint8Array) => unknown;
  stringify?: (input: unknown) => Buffer;
  blockQuery?: BlockQuery;
};

function parseJsonFromRawResponse(response: Uint8Array): unknown {
  return JSON.parse(Buffer.from(response).toString());
}

function bytesJsonStringify(input: unknown): Buffer {
  return Buffer.from(JSON.stringify(input));
}

/** The read-only part of the near-api-js 2.x `Account`. */
export class ReadOnlyAccount {
  readonly connection: Connection;
  readonly accountId: string;

  constructor(connection: Connection, accountId: string) {
    this.connection = connection;
    this.accountId = accountId;
  }

  /** Raw `view_account` result at optimistic finality. */
  state(): Promise<AccountViewRaw> {
    return this.connection.provider.query<AccountViewRaw>({
      request_type: "view_account",
      account_id: this.accountId,
      finality: "optimistic",
    });
  }

  /**
   * Calls a contract view method, by default at optimistic finality. Returns
   * the parsed JSON result, or `false` when the method returns nothing.
   */
  async viewFunction({
    contractId,
    methodName,
    args = {},
    parse = parseJsonFromRawResponse,
    stringify = bytesJsonStringify,
    blockQuery = { finality: "optimistic" },
  }: ViewFunctionCallOptions): Promise<unknown> {
    if (!isBytes(args) && (Array.isArray(args) || typeof args !== "object")) {
      throw new PositionalArgsError();
    }
    const encodedArgs = stringify(args);
    const result = await this.connection.provider.query<CodeResult>({
      request_type: "call_function",
      ...blockQuery,
      account_id: contractId,
      method_name: methodName,
      args_base64: encodedArgs.toString("base64"),
    });
    return (
      result.result &&
      result.result.length > 0 &&
      parse(Buffer.from(result.result))
    );
  }

  /**
   * Balance breakdown in yoctoNEAR. `available` excludes the larger of the
   * staked amount and the storage cost.
   */
  async getAccountBalance(): Promise<AccountBalance> {
    const protocolConfig =
      await this.connection.provider.experimental_protocolConfig({
        finality: "final",
      });
    const state = await this.state();

    const costPerByte = new BN(
      protocolConfig.runtime_config.storage_amount_per_byte,
    );
    const stateStaked = new BN(state.storage_usage).mul(costPerByte);
    const staked = new BN(state.locked);
    const totalBalance = new BN(state.amount).add(staked);
    const availableBalance = totalBalance.sub(BN.max(staked, stateStaked));

    return {
      total: totalBalance.toString(),
      stateStaked: stateStaked.toString(),
      staked: staked.toString(),
      available: availableBalance.toString(),
    };
  }
}

export type ContractOptions = {
  viewMethods?: string[];
  changeMethods?: string[];
};

const isUint8Array = (x: unknown) => Boolean(x) && isBytes(x as object);
const isObject = (x: unknown) =>
  Object.prototype.toString.call(x) === "[object Object]";

/**
 * near-api-js 2.x `Contract` for view calls: each view method becomes
 * `contract.method(args?, options?)`. This app signs transactions elsewhere,
 * so change methods only reject.
 */
export class Contract {
  readonly account: ReadOnlyAccount;
  readonly contractId: string;

  constructor(
    account: ReadOnlyAccount,
    contractId: string,
    { viewMethods = [], changeMethods = [] }: ContractOptions,
  ) {
    this.account = account;
    this.contractId = contractId;

    for (const name of viewMethods) {
      Object.defineProperty(this, name, {
        writable: false,
        enumerable: true,
        value: async (
          args: object = {},
          options: object = {},
          ...ignored: unknown[]
        ) => {
          if (
            ignored.length ||
            !(isObject(args) || isUint8Array(args)) ||
            !isObject(options)
          ) {
            throw new PositionalArgsError();
          }
          return this.account.viewFunction({
            contractId: this.contractId,
            methodName: name,
            args,
            ...options,
          });
        },
      });
    }

    for (const name of changeMethods) {
      Object.defineProperty(this, name, {
        writable: false,
        enumerable: true,
        value: () =>
          Promise.reject(
            new Error(
              `Cannot call ${name}: this contract wrapper only supports view methods`,
            ),
          ),
      });
    }
  }
}
