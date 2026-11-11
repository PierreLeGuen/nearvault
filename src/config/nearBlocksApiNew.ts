import Bottleneck from "bottleneck";
import { fetchJson } from "~/lib/client";

export const baseUrl = "https://api.nearblocks.io";

// NearBlocks API v3 (v1/v2 are switched off on 2026-11-22).
// Migration guide: https://api.nearblocks.io/api-docs/migration

type PublicKeyEntry = {
  public_key: string;
  account_id: string;
  permission_kind: string;
};

type KeysObject = {
  data: PublicKeyEntry[];
};

type FtAsset = {
  contract: string;
  amount: string;
};

type Paginated<T> = {
  data: T[];
  meta?: { next_page?: string; prev_page?: string };
};

// v3 page size is capped at 100; stop after this many pages so one wallet
// can't drain the rate limiter.
const FT_PAGE_LIMIT = 100;
const FT_MAX_PAGES = 10;

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

  private get<T>(path: string) {
    return this.limiter.schedule(() =>
      fetchJson<T>(
        `${this.baseUrl}${path}`,
        this.apiKey
          ? { headers: { Authorization: `Bearer ${this.apiKey}` } }
          : undefined,
      ),
    );
  }

  getAccountsForPublicKey(publicKey: string) {
    return this.get<KeysObject>(`/v3/keys/${publicKey}`);
  }

  // Returns the FT contract ids the account holds.
  async getTokensForAccount(accountId: string): Promise<string[]> {
    const contracts: string[] = [];
    let next: string | undefined;
    for (let page = 0; page < FT_MAX_PAGES; page++) {
      const params = new URLSearchParams({ limit: String(FT_PAGE_LIMIT) });
      if (next) params.set("next", next);
      const res = await this.get<Paginated<FtAsset>>(
        `/v3/accounts/${accountId}/assets/fts?${params.toString()}`,
      );
      contracts.push(...res.data.map((t) => t.contract));
      next = res.meta?.next_page;
      if (!next) break;
    }
    return contracts;
  }

  // Kitwallet endpoints kept their v1 response shape in v3.
  getStakingDeposits(accountId: string) {
    return this.get<ValidatorDeposits>(
      `/v3/kitwallet/staking-deposits/${accountId}`,
    );
  }

  getStakingPools() {
    return this.get<string[]>(`/v3/kitwallet/stakingPools`);
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
