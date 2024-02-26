import { fetchJson } from "~/lib/client";

export const baseUrl = "https://api3.nearblocks.io";

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

export const newNearNearBlocksApiNew = (baseUrl: string) => ({
  getAccountsForPublicKey: (publicKey: string) =>
    fetchJson<KeysObject>(`${baseUrl}/v1/keys/${publicKey}`),

  getTokensForAccount: (accountId: string) =>
    fetchJson<TokensObject>(`${baseUrl}/v1/account/${accountId}/tokens`),

  getStakingDeposits: (accountId: string) =>
    fetchJson<ValidatorDeposits>(
      `${baseUrl}/v1/kitwallet/staking-deposits/${accountId}`,
    ),

  getStakingPools: () =>
    fetchJson<string[]>(`${baseUrl}/v1/kitwallet/stakingPools`),
});
