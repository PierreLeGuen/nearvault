import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson, viewCall } from "~/lib/client";
import { Token } from "~/lib/transformations";
import { useGetAllTokensWithBalanceForWallet } from "./teams";
import { FungibleTokenMetadata } from "~/lib/ft/contract";

export const EXCHANGES = ["REF"] as const;

export const useSupportedExchange = () => {
  return useQuery(["supportedExchange"], () => {
    return [EXCHANGES[0]];
  });
};

export const useGetSwapOpportunities = (token: Token, exchange: string) => {
  return useQuery(["swapIn", token, exchange], () => {
    if (exchange !== "REF") {
      throw new Error("Exchange not supported");
    }
  });
};

export interface LiquidityPool {
  pool_kind: string;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  amp: number;
  farming: boolean;
  token_symbols: string[];
  id: string;
  tvl: string;
  token0_ref_price: string;
}

export const useGetLiquidityPools = (
  exchange: string,
  includeEmptyPools: boolean,
  fundingAccountId: string,
) => {
  const tokensQuery = useGetAllTokensWithBalanceForWallet(fundingAccountId);
  return useQuery(
    ["liquidityPools", exchange, includeEmptyPools, fundingAccountId],
    async () => {
      const pools = await fetchJson<LiquidityPool[]>(
        "https://indexer.ref.finance/list-pools",
      );

      const tokenAccountIds = [
        ...new Set(
          pools.flatMap((pool) => {
            return pool.token_account_ids;
          }),
        ),
      ];

      const promises = tokenAccountIds.map(async (accountId) => {
        try {
          const res = await viewCall<
            FungibleTokenMetadata & { accountId: string }
          >(accountId, "ft_metadata", {});
          res.accountId = accountId;
          return res;
        } catch (e) {
          console.log(e);
        }
      });
      const ftMetadatas = (await Promise.all(promises)).filter(Boolean);

      console.log(ftMetadatas);

      return (
        pools
          .filter((pool) => {
            return includeEmptyPools || pool.tvl !== "0";
          })
          // .filter((pool) => {
          //   if (includeNotOwningTokens) {
          //     return true;
          //   }
          //   pool.token_account_ids.every((id) =>
          //     tokensQuery.data.find((t) => t.account_id === id),
          //   );
          // })
          .map((pool) => {
            const amounts = pool.amounts.map((amount, i) => {
              const accId = pool.token_account_ids[i];
              const ftMetadata = ftMetadatas.find(
                (ft) => ft.accountId === accId,
              );
              if (!ftMetadata) {
                return "0";
              }
              const formattedAmount =
                Number(amount) / 10 ** ftMetadata.decimals;
              return formattedAmount.toString();
            });
            pool.amounts = amounts;
            return pool;
          })
      );
    },
    {
      enabled: !!tokensQuery.data,
    },
  );
};

export const useGetLiquidityPoolById = (poolId?: string) => {
  return useQuery(
    ["liquidityPool", poolId],
    async () => {
      const poolDetails = await fetchJson<LiquidityPool[]>(
        "https://indexer.ref.finance/list-pools-by-ids?ids=" + poolId,
      );
      return poolDetails[0];
    },
    { enabled: !!poolId },
  );
};

type TokenInfo = {
  price: string;
  decimal: number;
  symbol: string;
};

type Tokens = Record<string, TokenInfo>;

export const useGetTokenPrices = () => {
  return useQuery(["tokenPrices"], async () => {
    const res = await fetchJson<Tokens>(
      "https://indexer.ref.finance/list-token-price",
    );
    return res;
  });
};
