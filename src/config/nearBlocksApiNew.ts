import Bottleneck from "bottleneck";
import { fetchJson } from "~/lib/client";

export const baseUrl = "https://api.nearblocks.io";

type PublicKeyEntry = {
  public_key: string;
  account_id: string;
  permission_kind: string;
  created: TransactionInfo;
  deleted: TransactionInfo | null;
};

type TransactionInfo = {
  transaction_hash: string | null;
  block_timestamp: number | null;
};

type KeysObject = {
  keys: PublicKeyEntry[];
};

type TokensObject = {
  tokens: {
    fts: string[];
    nfts: string[];
  };
};

type ValidatorDeposit = {
  deposit: string;
  validator_id: string;
};

type ValidatorDeposits = ValidatorDeposit[];

export class NearBlocksApi {
  private limiter: Bottleneck;
  private baseUrl: string;
  private apiKey: string | null;
  private static instance: NearBlocksApi | null = null;
  private static currentUrl: string | null = null;
  private static currentApiKey: string | null = null;

  private constructor(baseUrl: string, apiKey: string | null = null) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;

    // Configure rate limiter based on API key presence
    if (apiKey) {
      // With API key: 150 calls per minute = 2.5 calls per second
      this.limiter = new Bottleneck({
        minTime: 500, // 500ms between requests = 2 req/s = 120 req/min
        maxConcurrent: 3, // Allow up to 5 concurrent requests
        reservoir: 150, // 150 tokens available
        reservoirRefreshAmount: 150, // Refill to 150 tokens
        reservoirRefreshInterval: 60 * 1000, // Refill every minute
      });
    } else {
      // Without API key: more restrictive rate limit (30 calls per minute)
      this.limiter = new Bottleneck({
        minTime: 2000, // 2000ms between requests = 0.5 req/s = 30 req/min
        maxConcurrent: 1, // Only 1 concurrent request
        reservoir: 30, // 30 tokens available
        reservoirRefreshAmount: 30, // Refill to 30 tokens
        reservoirRefreshInterval: 60 * 1000, // Refill every minute
      });
    }
  }

  // Singleton getInstance method that handles URL and API key changes
  public static getInstance(
    url: string,
    apiKey: string | null = null,
  ): NearBlocksApi {
    if (
      !NearBlocksApi.instance ||
      url !== NearBlocksApi.currentUrl ||
      apiKey !== NearBlocksApi.currentApiKey
    ) {
      NearBlocksApi.instance = new NearBlocksApi(url, apiKey);
      NearBlocksApi.currentUrl = url;
      NearBlocksApi.currentApiKey = apiKey;
    }
    return NearBlocksApi.instance;
  }

  getAccountsForPublicKey(publicKey: string) {
    return this.limiter.schedule(() =>
      fetchJson<KeysObject>(
        `${this.baseUrl}/v1/keys/${publicKey}`,
        this.apiKey
          ? { headers: { Authorization: `Bearer ${this.apiKey}` } }
          : undefined,
      ),
    );
  }

  getTokensForAccount(accountId: string) {
    return this.limiter.schedule(() =>
      fetchJson<TokensObject>(
        `${this.baseUrl}/v1/account/${accountId}/tokens`,
        this.apiKey
          ? { headers: { Authorization: `Bearer ${this.apiKey}` } }
          : undefined,
      ),
    );
  }

  getStakingDeposits(accountId: string) {
    return this.limiter.schedule(() =>
      fetchJson<ValidatorDeposits>(
        `${this.baseUrl}/v1/kitwallet/staking-deposits/${accountId}`,
        this.apiKey
          ? { headers: { Authorization: `Bearer ${this.apiKey}` } }
          : undefined,
      ),
    );
  }

  getStakingPools() {
    return this.limiter.schedule(() =>
      fetchJson<string[]>(
        `${this.baseUrl}/v1/kitwallet/stakingPools`,
        this.apiKey
          ? { headers: { Authorization: `Bearer ${this.apiKey}` } }
          : undefined,
      ),
    );
  }
}

/**
 * @deprecated Use NearBlocksApi.getInstance() instead for singleton pattern
 */
export const newNearNearBlocksApiNew = (
  baseUrl: string,
  apiKey: string | null = null,
) => ({
  getAccountsForPublicKey: (publicKey: string) =>
    NearBlocksApi.getInstance(baseUrl, apiKey).getAccountsForPublicKey(
      publicKey,
    ),

  getTokensForAccount: (accountId: string) =>
    NearBlocksApi.getInstance(baseUrl, apiKey).getTokensForAccount(accountId),

  getStakingDeposits: (accountId: string) =>
    NearBlocksApi.getInstance(baseUrl, apiKey).getStakingDeposits(accountId),

  getStakingPools: () =>
    NearBlocksApi.getInstance(baseUrl, apiKey).getStakingPools(),
});

export type NearBlocksApiNewType = ReturnType<typeof newNearNearBlocksApiNew>;
