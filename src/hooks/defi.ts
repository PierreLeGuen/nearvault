import { useMutation, useQuery } from "@tanstack/react-query";
import BigNumber from "bignumber.js";
import BN from "bn.js";
import { transactions } from "near-api-js";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { toast } from "react-toastify";
import { z } from "zod";
import { fetchJson, getStorageBalance, viewCall } from "~/lib/client";
import { type FungibleTokenMetadata } from "~/lib/ft/contract";
import { type Token } from "~/lib/transformations";
import {
  convertToIndivisibleFormat,
  getBurrowConfigsForTokens,
  getFtMetadataForAccounts,
} from "~/lib/utils";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { functionCallAction } from "./lockup";
import { addMultisigRequestAction } from "./manage";
import { TGas } from "./staking";
import { useStorageDeposit } from "./transfers";

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

export const useGetRefLiquidityPools = (
  includeEmptyPools: boolean,
  poolType?: "SIMPLE_POOL" | "RATED_SWAP",
) => {
  return useQuery(["liquidityPools", includeEmptyPools], async () => {
    const pools = await fetchJson<LiquidityPool[]>(
      "https://api.ref.finance/list-pools",
    );

    const tokenAccountIds = [
      ...new Set(
        pools.flatMap((pool) => {
          return pool.token_account_ids;
        }),
      ),
    ];

    const ftMetadatas = await getFtMetadataForAccounts(tokenAccountIds);


    return pools
      .filter((pool) => {
        return includeEmptyPools || pool.tvl !== "0";
      })
      .filter((pool) => {
        if (!poolType) {
          return true;
        }
        return pool.pool_kind === poolType;
      })
      .map((pool) => {
        const amounts = pool.amounts.map((amount, i) => {
          const accId = pool.token_account_ids[i];
          const ftMetadata = ftMetadatas.find((ft) => ft.accountId === accId);
          if (!ftMetadata) {
            return "0";
          }
          const formattedAmount = Number(amount) / 10 ** ftMetadata.decimals;
          return formattedAmount.toString();
        });
        pool.amounts = amounts;
        return pool;
      })
      .sort((a, b) => {
        return Number(a.id) - Number(b.id);
      });
  });
};
export const useGetPoolsForToken = (tokenId: string) => {
  return useQuery(["poolsForToken", tokenId], async () => {
    const pools = await fetchJson<LiquidityPool[]>(
      "https://api.ref.finance/list-pools",
    );
    const tokenAccountIds = [
      ...new Set(
        pools.flatMap((pool) => {
          return pool.token_account_ids;
        }),
      ),
    ];
    const ftMetadatas = await getFtMetadataForAccounts(tokenAccountIds);

    const accountIdToSymbol: Record<string, string> = {};
    ftMetadatas.forEach((ftMetadata) => {
      accountIdToSymbol[ftMetadata.accountId] = ftMetadata.symbol;
    });

    const filteredPools = pools
      .filter((pool) => {
        return pool.token_account_ids.includes(tokenId);
      })
      .map((pool) => {
        const amounts = pool.amounts.map((amount, i) => {
          const accId = pool.token_account_ids[i];
          const ftMetadata = ftMetadatas.find((ft) => ft.accountId === accId);
          if (!ftMetadata) {
            return "0";
          }
          const formattedAmount = Number(amount) / 10 ** ftMetadata.decimals;
          return formattedAmount.toString();
        });
        pool.amounts = amounts;
        pool.token_account_ids = pool.token_account_ids.filter(
          (id) => id !== tokenId,
        );
        pool.token_symbols = pool.token_symbols.filter(
          (symbol) => symbol !== tokenId,
        );
        return pool;
      })
      .sort((a, b) => {
        return Number(a.id) - Number(b.id);
      });

    return {
      pools: filteredPools,
      accountIdToSymbol,
    };
  });
};

export const useGetLiquidityPoolById = (poolId?: string) => {
  return useQuery(
    ["liquidityPool", poolId],
    async () => {
      const poolDetails = await fetchJson<LiquidityPool[]>(
        "https://api.ref.finance/list-pools-by-ids?ids=" + poolId,
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
      "https://api.ref.finance/list-token-price",
    );
    return res;
  });
};

type DepositParams = {
  fundingAccId: string;
  tokenLeftAccId?: string;
  tokenLeftAmount?: string;
  tokenRightAccId?: string;
  tokenRightAmount?: string;
  tokenAccIds?: string[];
  tokenAmounts?: string[];
  poolId: string;
};

export const useDepositToRefLiquidityPool = () => {
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
            parseNearAmount("0.125"),
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

      const tokenIds = params.tokenAccIds ||
        [params.tokenLeftAccId, params.tokenRightAccId].filter(Boolean);
      const amounts = params.tokenAmounts ||
        [params.tokenLeftAmount, params.tokenRightAmount].filter(Boolean);

      for (let i = 0; i < tokenIds.length; i++) {
        if (amounts[i] === "0") continue;

        const ftTransferCallRequest = transactions.functionCall(
          "add_request",
          addMultisigRequestAction(tokenIds[i], [
            functionCallAction(
              "ft_transfer_call",
              {
                receiver_id: refAccountId,
                amount: amounts[i],
                msg: "",
              },
              "1",
              (50 * TGas).toString(),
            ),
          ]),
          new BN(100 * TGas),
          new BN("0"),
        );

        await wsStore.signAndSendTransaction({
          senderId: params.fundingAccId,
          receiverId: params.fundingAccId,
          actions: [ftTransferCallRequest],
        });
      }

      const addLiquidityRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "add_liquidity",
            {
              pool_id: parseInt(params.poolId),
              amounts: amounts,
            },
            parseNearAmount("0.01"),
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [addLiquidityRequest],
      });
    },
  });
};

const stablePoolsRefDeposit = z.object({
  poolId: z.number(),
  tokens: z.array(z.string()),
  amounts: z.array(z.string()),
  shares: z.string(),
  fundingAccId: z.string(),
});

export const useDepositToRefStableLiquidityPool = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: z.infer<typeof stablePoolsRefDeposit>) => {
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
            parseNearAmount("0.125"),
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

      for (let i = 0; i < params.tokens.length; i++) {
        if (params.amounts[i] === "0") {
          continue;
        }
        const ftTransferCallRequest = transactions.functionCall(
          "add_request",
          addMultisigRequestAction(params.tokens[i], [
            functionCallAction(
              "ft_transfer_call",
              {
                receiver_id: refAccountId,
                amount: params.amounts[i],
                msg: "",
              },
              "1",
              (50 * TGas).toString(),
            ),
          ]),
          new BN(100 * TGas),
          new BN("0"),
        );

        await wsStore.signAndSendTransaction({
          senderId: params.fundingAccId,
          receiverId: params.fundingAccId,
          actions: [ftTransferCallRequest],
        });
      }

      const addStableLiquidityRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "add_stable_liquidity",
            {
              pool_id: params.poolId,
              amounts: params.amounts,
              min_shares: params.shares,
            },
            parseNearAmount("0.01"),
            (100 * TGas).toString(),
          ),
        ]),
        new BN(200 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [addStableLiquidityRequest],
      });
    },
  });
};

export interface LiquidityPoolRef {
  pool_kind: string;
  token_account_ids: string[];
  amounts: string[];
  total_fee: number;
  shares_total_supply: string;
  amp: number;
  farming: boolean;
  token_symbols: string[];
  decimals: number[];
  symbols: string[];
  id: string;
}

export const useGetRefLiquidityPoolsForAccount = (accountId?: string) => {
  return useQuery(
    ["liquidityPoolsForAccount", accountId],
    async () => {
      const endpoint = "https://api.ref.finance/liquidity-pools/" + accountId;
      const pools = await fetchJson<LiquidityPoolRef[]>(endpoint);
      const ftMetadatas = await getFtMetadataForAccounts(
        pools.flatMap((pool) => pool.token_account_ids),
      );
      return pools.map((pool) => {
        const amounts = pool.amounts.map((amount, i) => {
          const accId = pool.token_account_ids[i];
          const ftMetadata = ftMetadatas.find((ft) => ft.accountId === accId);
          if (!ftMetadata) {
            return "0";
          }
          const formattedAmount = Number(amount) / 10 ** ftMetadata.decimals;
          return formattedAmount.toString();
        });
        const decimals = pool.token_account_ids.map((accId) => {
          const ftMetadata = ftMetadatas.find((ft) => ft.accountId === accId);
          if (!ftMetadata) {
            return 0;
          }
          return ftMetadata.decimals;
        });
        const symbols = pool.token_account_ids.map((accId) => {
          const ftMetadata = ftMetadatas.find((ft) => ft.accountId === accId);
          if (!ftMetadata) {
            return "";
          }
          return ftMetadata.symbol;
        });
        pool.decimals = decimals;
        pool.amounts = amounts;
        pool.symbols = symbols;

        return pool;
      });
    },
    { enabled: !!accountId },
  );
};

export const useGetRefPoolShares = (poolId?: string, accountId?: string) => {
  return useQuery(
    ["poolShares", poolId, accountId],
    async () => {
      return viewCall<string>("v2.ref-finance.near", "get_pool_shares", {
        pool_id: parseInt(poolId),
        account_id: accountId,
      });
    },
    { enabled: !!poolId && !!accountId },
  );
};

export const useGetRefSharesForAmount = (
  amounts: string[],
  poolId: string,
  fundingAccId: string,
) => {
  const shares = useGetRefPoolShares(poolId, fundingAccId);
  const poolsQuery = useGetRefLiquidityPoolsForAccount(fundingAccId);

  return useQuery(
    ["sharesForAmount", amounts, poolId, fundingAccId],
    () => {
      const shares: string[] = [];
      const pool = poolsQuery.data?.find((p) => p.id === poolId);
      if (!pool) {
        throw new Error("Pool not found");
      }

      console.log(pool);
      console.log(amounts);

      for (const indivAmount of amounts) {
        const sharesTotalSupply = new BigNumber(pool.shares_total_supply);
        const amountInPool = pool.amounts
          .flatMap((amount) => {
            return new BigNumber(amount);
          })
          .reduce((acc, curr) => acc.plus(curr), new BigNumber(0));

        const myShares = sharesTotalSupply
          .multipliedBy(indivAmount)
          .dividedBy(amountInPool);
        shares.push(myShares.toString());
      }
      console.log(shares);

      return shares;
    },
    { enabled: !!shares.data },
  );
};

export const withdrawRef = z.object({
  fundingAccId: z.string(),
  poolId: z.number(),
  tokens: z.array(z.string()),
  amounts: z.array(z.string()),
  maxSharesBurn: z.string(),
});

export const useWithdrawFromRefLiquidityPool = () => {
  const wsStore = useWalletTerminator();
  const viewQuery = useGetRefLiquidityPoolsForAccount();

  return useMutation({
    mutationFn: async (params: z.infer<typeof withdrawRef>) => {
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
            parseNearAmount("0.005"),
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      const removeLiquidityRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "remove_liquidity_by_tokens",
            {
              pool_id: params.poolId,
              max_burn_shares: params.maxSharesBurn,
              amounts: params.amounts,
            },
            "1",
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
        actions: [removeLiquidityRequest],
      });

      await viewQuery.refetch();

      for (let i = 0; i < params.tokens.length; i++) {
        if (params.amounts[i] === "0") {
          continue;
        }

        const withdraw = transactions.functionCall(
          "add_request",
          addMultisigRequestAction(refAccountId, [
            functionCallAction(
              "withdraw",
              {
                token_id: params.tokens[i],
                amount: "0",
                unregister: false,
              },
              "1",
              (200 * TGas).toString(),
            ),
          ]),
          new BN(300 * TGas),
          new BN("0"),
        );

        await wsStore.signAndSendTransaction({
          senderId: params.fundingAccId,
          receiverId: params.fundingAccId,
          actions: [withdraw],
        });
      }
    },
  });
};

export const useRemoveLiquidity = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async ({
      fundingAccId,
      poolId,
      shares,
      minAmounts,
    }: {
      fundingAccId: string;
      poolId: number;
      shares: string;
      minAmounts: string[];
    }) => {
      const refAccountId = "v2.ref-finance.near";

      const removeLiquidityRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "remove_liquidity",
            {
              pool_id: poolId,
              shares,
              min_amounts: minAmounts,
            },
            "1", // depositYocto
            (100 * TGas).toString(),
          ),
        ]),
        new BN(200 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: fundingAccId,
        receiverId: fundingAccId,
        actions: [removeLiquidityRequest],
      });
    },
  });
};

export interface BurrowAssetConfig {
  borrow_apr: string;
  borrowed: BalanceAndShares;
  config: Config;
  farms: unknown[]; // Assuming 'any' type here as there's no provided structure for farms
  last_update_timestamp: string;
  prot_fee: string;
  reserved: string;
  supplied: BalanceAndShares;
  supply_apr: string;
  token_id: string;
}

interface BalanceAndShares {
  balance: string;
  shares: string;
}

interface Config {
  can_borrow: boolean;
  can_deposit: boolean;
  can_use_as_collateral: boolean;
  can_withdraw: boolean;
  extra_decimals: number;
  max_utilization_rate: string;
  net_tvl_multiplier: number;
  prot_ratio: number;
  reserve_ratio: number;
  target_utilization: number;
  target_utilization_rate: string;
  volatility_ratio: number;
}

export const burrowSupplyFormSchema = z.object({
  token: z.string(),
  tokenAmount: z.number(),
  funding: z.string(),
});

export const useSupplyToBurrow = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: z.infer<typeof burrowSupplyFormSchema>) => {
      const burrowAccountId = "contract.main.burrow.near";

      const storageDepositRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(burrowAccountId, [
          functionCallAction(
            "storage_deposit",
            {
              account_id: params.funding,
              registration_only: false,
            },
            parseNearAmount("0.25"),
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      const config = await viewCall<BurrowAssetConfig>(
        burrowAccountId,
        "get_asset",
        { token_id: params.token },
      );

      const ftMetadata = await viewCall<FungibleTokenMetadata>(
        params.token,
        "ft_metadata",
        {},
      );

      const indivisibleAmount = convertToIndivisibleFormat(
        params.tokenAmount.toString(),
        ftMetadata.decimals,
      );

      const ftTransferCall = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.token, [
          functionCallAction(
            "ft_transfer_call",
            {
              receiver_id: burrowAccountId,
              amount: indivisibleAmount.toString(),
              msg: config.config.can_use_as_collateral
                ? `{\"Execute\":{\"actions\":[{\"IncreaseCollateral\":{\"token_id\":\"${params.token
                }\",\"max_amount\":\"${indivisibleAmount.toString()}${"0".repeat(
                  config.config.extra_decimals,
                )}\"}}]}}`
                : "",
            },
            "1",
            (50 * TGas).toString(),
          ),
        ]),
        new BN(100 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: params.funding,
        receiverId: params.funding,
        actions: [storageDepositRequest],
      });

      await wsStore.signAndSendTransaction({
        senderId: params.funding,
        receiverId: params.funding,
        actions: [ftTransferCall],
      });
    },
  });
};

export const burrowWithdrawFormSchema = z.object({
  token: z.string(),
  tokenAmount: z.string(),
  funding: z.string(),
});

export const useWithdrawSupplyFromBurrow = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async (params: z.infer<typeof burrowWithdrawFormSchema>) => {
      const burrowAccountId = "contract.main.burrow.near";
      const oracle = "priceoracle.near";

      const config = await viewCall<BurrowAssetConfig>(
        burrowAccountId,
        "get_asset",
        { token_id: params.token },
      );

      const ftMetadata = await viewCall<FungibleTokenMetadata>(
        params.token,
        "ft_metadata",
        {},
      );

      const indivisibleAmount = convertToIndivisibleFormat(
        params.tokenAmount.toString(),
        ftMetadata.decimals + config.config.extra_decimals,
      );

      const ftTransferCall = config.config.can_use_as_collateral
        ? transactions.functionCall(
          "add_request",
          addMultisigRequestAction(oracle, [
            functionCallAction(
              "oracle_call",
              {
                receiver_id: burrowAccountId,
                msg: `{\"Execute\":{\"actions\":[{\"DecreaseCollateral\":{\"token_id\":\"${params.token
                  }\",\"amount\":\"${indivisibleAmount.toString()}\"}},{\"Withdraw\":{\"token_id\":\"${params.token
                  }\"}}]}}`,
              },
              "1",
              (200 * TGas).toString(),
            ),
          ]),
          new BN(300 * TGas),
          new BN("0"),
        )
        : transactions.functionCall(
          "add_request",
          addMultisigRequestAction(burrowAccountId, [
            functionCallAction(
              "execute",
              {
                actions: [
                  {
                    Withdraw: {
                      token_id: params.token,
                      max_amount: indivisibleAmount.toString(),
                    },
                  },
                ],
              },
              "1",
              (200 * TGas).toString(),
            ),
          ]),
          new BN(300 * TGas),
          new BN("0"),
        );

      await wsStore.signAndSendTransaction({
        senderId: params.funding,
        receiverId: params.funding,
        actions: [ftTransferCall],
      });
    },
  });
};

type BurrowAccountInfo = {
  account_id: string;
  supplied: Array<{
    token_id: string;
    balance: string;
    shares: string;
    apr: string;
  }>;
  collateral: Array<{
    token_id: string;
    balance: string;
    shares: string;
    apr: string;
  }>;
  borrowed: unknown[]; // Empty in the example, could be an array of a specific type if structure is known
  farms: Array<{
    farm_id: { Supplied?: string } | string;
    rewards: Array<{
      reward_token_id: string;
      asset_farm_reward?: {
        reward_per_day: string;
        booster_log_base: string;
        remaining_rewards: string;
        boosted_shares: string;
      };
      boosted_shares: string;
      unclaimed_amount: string;
    }>;
  }>;
  has_non_farmed_assets: boolean;
  booster_staking: unknown;
};

// near contract call-function as-read-only contract.main.burrow.near get_account json-args '{"account_id":"pqla.near"}' network-config mainnet now
export const useGetBurrowSuppliedTokens = (accountId: string) => {
  return useQuery(["burrowHoldings", accountId], async () => {
    const burrowAccountId = "contract.main.burrow.near";
    const holdings = await viewCall<BurrowAccountInfo>(
      burrowAccountId,
      "get_account",
      {
        account_id: accountId,
      },
    );
    let ftMetadatas = await getFtMetadataForAccounts(
      holdings.collateral.map((t) => t.token_id),
    );
    let configs = await getBurrowConfigsForTokens(
      holdings.collateral.map((t) => t.token_id),
    );
    const ft2 = await getFtMetadataForAccounts(
      holdings.supplied.map((t) => t.token_id),
    );
    const c2 = await getBurrowConfigsForTokens(
      holdings.supplied.map((t) => t.token_id),
    );

    ftMetadatas = ftMetadatas.concat(ft2);
    configs = configs.concat(c2);

    const suppliedAndCollat = [...holdings.supplied, ...holdings.collateral];

    const tokens = suppliedAndCollat.map((token) => {
      const b = BigNumber(token.balance);
      // add some slippage
      // const c = b.multipliedBy(0.999);
      token.balance = b.toFixed();
      const ftMetadata = ftMetadatas.find(
        (ft) => ft.accountId === token.token_id,
      );
      const config = configs.find((c) => c.token_id === token.token_id);
      console.log(token, ftMetadata, config);

      return {
        token,
        ftMetadata,
        config,
      };
    });

    return tokens;
  });
};

export const burrowClaimRewardsSchema = z.object({
  accountId: z.string(),
});

export const useGetBurrowClaim = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async ({
      accountId,
    }: z.infer<typeof burrowClaimRewardsSchema>) => {
      const burrow = "contract.main.burrow.near";
      const claim = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(burrow, [
          functionCallAction(
            "account_farm_claim_all",
            {},
            "0",
            (200 * TGas).toString(),
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: accountId,
        receiverId: accountId,
        actions: [claim],
      });
    },
  });
};

type SwapParams = {
  fundingAccId: string;
  outAccId: string;
  inAccId: string;
  outAmount: string;
  minInAmount: string;
  poolId: string;
};

export const useRefSwap = () => {
  const wsStore = useWalletTerminator();
  const storageDeposit = useStorageDeposit();

  return useMutation({
    mutationFn: async (params: SwapParams) => {
      const refAccountId = "v2.ref-finance.near";

      const isRegistered = await getStorageBalance(
        params.inAccId,
        params.fundingAccId,
      );
      if (isRegistered === null) {
        toast.warn(
          "Your wallet is not registered with the incoming token. Please add and execute the following transaction first for the swap to work.",
        );
        await storageDeposit.mutateAsync({
          fundingAccId: params.fundingAccId,
          tokenAddress: params.inAccId,
          receiverAddress: params.fundingAccId,
        });
      }

      const ftTransferCallRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(params.outAccId, [
          functionCallAction(
            "ft_transfer_call",
            {
              receiver_id: refAccountId,
              amount: params.outAmount,
              msg: `{"force":0,"actions":[{"pool_id":${params.poolId},"token_in":"${params.outAccId}","token_out":"${params.inAccId}","amount_in":"${params.outAmount}","min_amount_out":"${params.minInAmount}"}]}`,
            },
            "1",
            (200 * TGas).toString(),
          ),
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: params.fundingAccId,
        receiverId: params.fundingAccId,
        actions: [ftTransferCallRequest],
      });
    },
  });
};

type Deposits = {
  [tokenId: string]: string;
};

export const useGetRefDeposits = (accountId?: string) => {
  return useQuery(
    ["refDeposits", accountId],
    async () => {
      if (!accountId) return null;

      const deposits = await viewCall<Deposits>(
        "v2.ref-finance.near",
        "get_deposits",
        { account_id: accountId }
      );

      // Filter out zero deposits
      const nonZeroDeposits = Object.entries(deposits)
        .filter(([_, amount]) => amount !== "0");

      if (nonZeroDeposits.length === 0) return {};

      const ftMetadatas = await getFtMetadataForAccounts(
        nonZeroDeposits.map(([tokenId]) => tokenId)
      );

      return Object.fromEntries(
        nonZeroDeposits.map(([tokenId, amount]) => {
          const metadata = ftMetadatas.find(ft => ft.accountId === tokenId);
          const formattedAmount = metadata
            ? (Number(amount) / Math.pow(10, metadata.decimals)).toString()
            : amount;

          return [tokenId, { amount, formattedAmount, metadata }];
        })
      );
    },
    {
      enabled: !!accountId,
      staleTime: 30 * 1000,
    }
  );
};

export const useRefWithdraw = () => {
  const wsStore = useWalletTerminator();

  return useMutation({
    mutationFn: async ({
      fundingAccId,
      tokenId,
      amount,
    }: {
      fundingAccId: string;
      tokenId: string;
      amount: string;
    }) => {
      const refAccountId = "v2.ref-finance.near";

      const withdrawRequest = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(refAccountId, [
          functionCallAction(
            "withdraw",
            {
              token_id: tokenId,
              amount,
              unregister: false,
            },
            "1",
            (200 * TGas).toString()
          ),
        ]),
        new BN(300 * TGas),
        new BN("0")
      );

      await wsStore.signAndSendTransaction({
        senderId: fundingAccId,
        receiverId: fundingAccId,
        actions: [withdrawRequest],
      });
    },
  });
};

// ➜  ~ near view $REF_EX predict_remove_liquidity '{"pool_id": 4514, "shares": "1499300386878853222530449150701"}'
// ▹▹▸▹▹ Getting a response to a read-only function call ...                                                    --------------
// No logs
// --------------
// Result:
// [
//   "1113982708197297037453526",
//   "393222484017"
// ]
// --------------
export const usePredictRemoveLiquidity = ({ poolId, shares }: { poolId: string, shares: string }) => {
  return useQuery({
    queryKey: ["predictRemoveLiquidity", poolId, shares],
    queryFn: async () => {
      const result = await viewCall<string[]>(
        "v2.ref-finance.near",
        "predict_remove_liquidity",
        { pool_id: parseInt(poolId), shares: shares }
      );

      return result;
    }
  })
}