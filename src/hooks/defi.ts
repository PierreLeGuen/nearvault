import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { fetchJson, viewCall } from "~/lib/client";
import { Token } from "~/lib/transformations";
import { useGetAllTokensWithBalanceForWallet } from "./teams";
import { FungibleTokenMetadata } from "~/lib/ft/contract";
import { transactions } from "near-api-js";
import { addMultisigRequestAction } from "./manage";
import { functionCallAction } from "./lockup";
import { config } from "~/config/config";
import { TGas } from "./staking";
import BN from "bn.js";
import { useWalletTerminator } from "~/store/slices/wallet-selector";

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

type DepositParams = {
  fundingAccId: string;
  tokenLeftAccId: string;
  tokenLeftAmount: string;
  tokenRightAccId: string;
  tokenRightAmount: string;
  poolId: string;
};

export const useDepositToLiquidityPool = () => {
  const wsStore = useWalletTerminator();
  return useMutation({
    mutationFn: async (params: DepositParams) => {
      const refAccountId = "v2.ref-finance.near";
      const storageDepositRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "storage_deposit",
            {
              account_id: params.fundingAccId,
              registration_only: false,
            },
            "0",
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      const ftTransferCallLeftRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.tokenLeftAccId, [
          functionCallAction(
            "ft_transfer_call",
            {
              receiver_id: refAccountId,
              amount: params.tokenLeftAmount,
              msg: "",
            },
            "0",
            (50 * TGas).toString(),
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      const ftTransferCallRightRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.tokenRightAccId, [
          functionCallAction(
            "ft_transfer_call",
            {
              receiver_id: refAccountId,
              amount: params.tokenRightAccId,
              msg: "",
            },
            "0",
            (50 * TGas).toString(),
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      const addLiquidityRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "add_liquidity",
            {
              pool_id: params.poolId,
              amounts: [params.tokenLeftAmount, params.tokenRightAmount],
            },
            "0",
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [storageDepositRequest],
      });
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [ftTransferCallLeftRequest],
      });
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [ftTransferCallRightRequest],
      });
      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [addLiquidityRequest],
      });
    },
  });
};
