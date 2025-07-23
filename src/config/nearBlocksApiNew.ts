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

export type NearBlocksApiNewType = ReturnType<typeof newNearNearBlocksApiNew>;

// Create a new limiter with a maximum of 5 requests per second
const limiter = new Bottleneck({
  minTime: 400, // 2.5 requests per second
});

export const newNearNearBlocksApiNew = (baseUrl: string) => ({
  getAccountsForPublicKey: (publicKey: string) =>
    limiter.schedule(() =>
      fetchJson<KeysObject>(`${baseUrl}/v1/keys/${publicKey}`),
    ),

  getTokensForAccount: (accountId: string) =>
    limiter.schedule(() =>
      fetchJson<TokensObject>(`${baseUrl}/v1/account/${accountId}/tokens`),
    ),

  getStakingDeposits: (accountId: string) =>
    limiter.schedule(() =>
      fetchJson<ValidatorDeposits>(
        `${baseUrl}/v1/kitwallet/staking-deposits/${accountId}`,
      ),
    ),

  getStakingPools: () =>
    limiter.schedule(() =>
      fetchJson<string[]>(`${baseUrl}/v1/kitwallet/stakingPools`),
    ),
});
