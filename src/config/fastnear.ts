import { fetchJson } from "~/lib/client";

type AccountInfo = {
  account_ids: string[];
  public_key: string;
};

export type FastNearApiType = ReturnType<typeof newFastNearApi>;
export const newFastNearApi = () => {
  return {
    getAccountsForKey: async (key: string) => {
      return await fetchJson<AccountInfo>(
        `https://api.fastnear.com/v0/public_key/${key}/all`,
      );
    },
    getTokensForAccount: async (accountId: string) => {
      return await fetchJson<{
        account_id: string;
        contract_ids: string[];
      }>(`https://api.fastnear.com/v0/account/${accountId}/ft`);
    },
    getStakingDeposits: async (accountId: string) => {
      return await fetchJson<{ deposits: string[] }>(
        `https://api.fastnear.com/v0/account/${accountId}/staking`,
      );
    },
    // getStakingPools: async () => {
    //   return await fetchJson<{ pools: string[] }>(
    //     `https://api.fastnear.com/v0/staking_pools`,
    //   );
    // },
  };
};
