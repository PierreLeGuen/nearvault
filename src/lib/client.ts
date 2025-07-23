import type * as nearAPI from "near-api-js";
import { providers } from "near-api-js";
import {
  type AccessKeyList,
  type CodeResult,
  type QueryResponseKind,
} from "near-api-js/lib/providers/provider";
import { config } from "~/config/config";
import { RateLimiter } from "~/utils/rate-limiter";
import { type FungibleTokenMetadata } from "./ft/contract";
import { initLockupContract } from "./lockup/contract";

export async function getSelectedPool(
  accountId: string,
  contractId: string,
  near: nearAPI.Near,
) {
  const c = await initLockupContract(accountId, contractId, near);
  return await c.get_staking_pool_account_id();
}

const TTA_URL = "http://65.21.11.6:8080";

export class RpcClient {
  private rateLimiter: RateLimiter;
  private _rpcClient: providers.JsonRpcProvider;
  private static instance: RpcClient | null = null;
  private static currentUrl: string | null = null;

  private constructor(url: string) {
    if (url === config.urls.rpc) {
      console.log("using FREE rpc url", url);
      this.rateLimiter = new RateLimiter(1);
    } else {
      console.log("using PRO rpc url", url);
      this.rateLimiter = new RateLimiter(100);
    }
    this._rpcClient = new providers.JsonRpcProvider({ url });
  }

  // Add getter for the provider
  get rpcClient(): providers.JsonRpcProvider {
    return this._rpcClient;
  }

  // Update getInstance to handle URL changes
  public static getInstance(url: string): RpcClient {
    if (!RpcClient.instance || url !== RpcClient.currentUrl) {
      RpcClient.instance = new RpcClient(url);
      RpcClient.currentUrl = url;
    }
    return RpcClient.instance;
  }

  async sendJsonRpc(method: string, params: any): Promise<any> {
    await this.rateLimiter.acquire();
    const result = await this._rpcClient.sendJsonRpc(method, params);
    return result;
  }

  async query<T extends QueryResponseKind>(request: any): Promise<T> {
    await this.rateLimiter.acquire();
    const result = await this._rpcClient.query<T>(request);
    return result;
  }
}

export async function getTransactionsReport(
  startDate: Date,
  endDate: Date,
  accountIds: string[],
  includeBalances: boolean,
) {
  const start = startDate.toISOString();
  const end = endDate.toISOString();
  const commaSeparatedAccountIds = accountIds.join(",");

  const url =
    `${TTA_URL}/tta?start_date=${start}&end_date=${end}&accounts=${commaSeparatedAccountIds}` +
    `&include_balances=${includeBalances.toString()}`;

  const response = await fetch(url, {
    method: "GET",
  });

  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = "report.csv";
    if (contentDisposition) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(contentDisposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, "");
      }
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export async function getFtBalanceAtDate(
  date: Date,
  accountId: string,
  provider: RpcClient,
) {
  const blockId = await getLikelyBlockIdForDate(date);

  const balance = await getFtBalanceAtBlock(
    "usdt.tether-token.near",
    accountId,
    Number(blockId),
    provider,
  );
  return balance;
}

export async function getFtBalanceAtBlock(
  contractId: string,
  accountId: string,
  blockId: number,
  provider: RpcClient,
) {
  const balance = await viewCall<string>(
    contractId,
    "ft_balance_of",
    {
      account_id: accountId,
    },
    provider,
    Number(blockId),
  );

  const ftMetadata = await viewCall<FungibleTokenMetadata>(
    contractId,
    "ft_metadata",
    {},
    provider,
    Number(blockId),
  );

  return {
    balance,
    ftMetadata,
  };
}

export async function getLikelyBlockIdForDate(date: Date) {
  const rfcDate = date.toISOString();

  const response = await (
    await fetch(TTA_URL + "/likelyBlockId?date=" + rfcDate)
  ).text();

  return response;
}

export function encodeArgs(args: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(args)).toString("base64");
}

export async function viewCall<T>(
  contract: string,
  method: string,
  args: Record<string, unknown>,
  provider: RpcClient,

  blockId?: number,
) {
  console.log("provider", provider);

  const opt = {};
  if (blockId) {
    opt["block_id"] = blockId;
  } else {
    opt["finality"] = "final";
  }

  const result = await provider.query<CodeResult>({
    request_type: "call_function",
    account_id: contract,
    method_name: method,
    args_base64: encodeArgs(args),
    ...opt,
  });

  return JSON.parse(Buffer.from(result.result).toString()) as T;
}

type AccessKeyResult = {
  block_hash: string;
  block_height: number;
  keys: Array<{
    access_key: {
      nonce: number;
      permission: {
        FunctionCall: {
          allowance: null;
          method_names: string[];
          receiver_id: string;
        };
      };
    };
    public_key: string;
  }>;
};

export const viewAccessKeyList = async (accountId: string, rpcUrl: string) => {
  const provider = new providers.JsonRpcProvider({ url: rpcUrl });

  const result = await provider.query<AccessKeyList>({
    request_type: "view_access_key_list",
    account_id: accountId,
    finality: "optimistic",
  });

  return result;
};

export const fetchJson = async <T>(url: string, options = {}): Promise<T> => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `HTTP ${response.status}: ${errorText || response.statusText}`,
    );
  }

  return (await response.json()) as T;
};

type RatedPoolResult = {
  amounts: string[];
  amp: number;
  c_amounts: string[];
  decimals: number[];
  rates: string[];
  shares_total_supply: string;
  token_account_ids: string[];
  total_fee: number;
};

export const getRatedPool = async (poolId: number, provider: RpcClient) => {
  // near contract call-function as-read-only v2.ref-finance.near get_rated_pool json-args '{"pool_id":4179}' network-config mainnet now
  return await viewCall<RatedPoolResult>(
    "v2.ref-finance.near",
    "get_rated_pool",
    {
      pool_id: poolId,
    },
    provider,
  );
};

type StorageBalance = {
  total: string;
  available: string;
};

export const getStorageBalance = async (
  tokenId: string,
  accountId: string,
  provider: RpcClient,
) => {
  return await viewCall<StorageBalance>(
    tokenId,
    "storage_balance_of",
    {
      account_id: accountId,
    },
    provider,
  );
};
