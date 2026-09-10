import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { z } from "zod";
import { DropdownFormField } from "~/components/inputs/dropdown";
import { TokenWithMaxInput } from "~/components/inputs/near";
import { SenderFormField } from "~/components/inputs/sender";
import { SwitchInput } from "~/components/inputs/switch";
import { TextInput } from "~/components/inputs/text";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import {
  useDepositToRefLiquidityPool,
  useGetLiquidityPoolById,
  useGetRefLiquidityPools,
  useGetTokenPrices,
  type LiquidityPool,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { viewCall } from "~/lib/client";
import {
  DEFAULT_LIQUIDITY_SLIPPAGE_PERCENT,
  getRefPoolKindLabel,
  isStableLikePool,
  type RefPoolKind,
} from "~/lib/defi/requests";
import { type FungibleTokenMetadata } from "~/lib/ft/contract";
import { type Token } from "~/lib/transformations";
import { convertToIndivisibleFormat } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";

const formSchema = z.object({
  poolId: z.string(),
  tokenAmounts: z.array(z.string()).length(4),
  enableEmptyPools: z.boolean(),
  funding: z.string(),
  slippage: z.string().refine((value) => {
    const percent = Number(value);
    return Number.isFinite(percent) && percent >= 0 && percent < 100;
  }, "Enter a slippage between 0 and 100 percent."),
});

export const getFormattedPoolBalance = (pool: {
  amounts: string[];
  token_symbols: string[];
  id: string;
  pool_kind?: string;
}) => {
  const kind =
    pool.pool_kind && pool.pool_kind !== "SIMPLE_POOL"
      ? ` [${getRefPoolKindLabel(pool.pool_kind)}]`
      : "";
  return `${pool.token_symbols.join("-")}${kind} (${pool.amounts
    .map((amount, idx) => `${amount} ${pool.token_symbols[idx]}`)
    .join(" | ")}) ID: ${pool.id}`;
};

export const getUserBalanceForPool = (
  pool?: LiquidityPool,
  userTokens?: Token[],
) => {
  const tokens: (Token | undefined)[] = [];

  if (pool && userTokens) {
    for (let i = 0; i < 4; i++) {
      const poolTokenId = pool.token_account_ids[i];
      let token = userTokens.find((t) => t.account_id == poolTokenId);

      if (poolTokenId === "wrap.near") {
        const nativeNear = userTokens.find((t) => t.account_id === "near");
        if (nativeNear && token) {
          token = {
            ...token,
            balance: (
              BigInt(token.balance) + BigInt(nativeNear.balance)
            ).toString(),
          };
        } else if (nativeNear && !token) {
          token = { ...nativeNear, account_id: "wrap.near", symbol: "wNEAR" };
        }
      }

      tokens.push(token);
    }
  }

  return tokens;
};

type RefLiquidityPoolsProps = {
  /** Restrict the pool list to these kinds (default: every kind). */
  poolKinds?: readonly RefPoolKind[];
};

const RefLiquidityPools = ({ poolKinds }: RefLiquidityPoolsProps) => {
  const form = useZodForm(formSchema, {
    defaultValues: {
      enableEmptyPools: false,
      tokenAmounts: ["0", "0", "0", "0"],
      slippage: DEFAULT_LIQUIDITY_SLIPPAGE_PERCENT.toString(),
    },
  });
  const walletsQuery = useTeamsWalletsWithLockups();
  const liquidityPoolsQuery = useGetRefLiquidityPools(
    form.watch("enableEmptyPools"),
    poolKinds,
  );

  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );
  const liquidityPoolDetailsQuery = useGetLiquidityPoolById(
    form.watch("poolId"),
  );
  const tokenPricesQuery = useGetTokenPrices();
  const depositMutation = useDepositToRefLiquidityPool();

  const selectedPool = liquidityPoolDetailsQuery.data;
  // Stable, rated and ALMM pools accept any token combination (including a
  // single token), so amounts are never auto-balanced for them.
  const stableLike = !!selectedPool && isStableLikePool(selectedPool.pool_kind);

  const userTokensForPool = getUserBalanceForPool(
    selectedPool,
    tokensQuery.data,
  );
  const { getProvider } = usePersistingStore();
  const watchedAmounts = form.watch("tokenAmounts");
  const [lastUpdatedIndex, setLastUpdatedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (
      stableLike ||
      !tokenPricesQuery.data ||
      !selectedPool ||
      lastUpdatedIndex === null ||
      !watchedAmounts[lastUpdatedIndex]
    ) {
      return;
    }

    const prices = tokenPricesQuery.data;
    const tokenIds = selectedPool.token_account_ids;
    const tokenCount = selectedPool.token_symbols.length;
    const amount = watchedAmounts[lastUpdatedIndex];

    // Skip if the amount is invalid
    if (amount === "" || isNaN(parseFloat(amount))) {
      return;
    }

    const val = parseFloat(amount);
    const currentTokenId = tokenIds[lastUpdatedIndex];
    const currentTokenPrice = parseFloat(prices[currentTokenId]?.price || "0");

    if (!currentTokenPrice) return;

    // Batch all updates together
    const updates = [...watchedAmounts];

    for (let i = 0; i < tokenCount; i++) {
      if (i !== lastUpdatedIndex) {
        const otherTokenId = tokenIds[i];
        const otherTokenPrice = parseFloat(prices[otherTokenId]?.price || "0");

        if (otherTokenPrice) {
          const otherAmount = (val * currentTokenPrice) / otherTokenPrice;
          updates[i] = otherAmount.toFixed(8);
        }
      }
    }

    // Update all values at once
    form.setValue("tokenAmounts", updates, {
      shouldValidate: false,
      shouldDirty: true,
    });
  }, [stableLike, lastUpdatedIndex, watchedAmounts[lastUpdatedIndex]]); // Only depend on the changed value

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedPool) {
      toast.error("Select a liquidity pool first.");
      return;
    }

    const provider = getProvider();
    const tokenAccIds = selectedPool.token_account_ids;

    try {
      const metadatas = await Promise.all(
        tokenAccIds.map((accId) =>
          viewCall<FungibleTokenMetadata>(accId, "ft_metadata", {}, provider),
        ),
      );

      const tokens = tokenAccIds.map((accountId, index) => ({
        accountId,
        amount: convertToIndivisibleFormat(
          values.tokenAmounts[index] || "0",
          metadatas[index].decimals,
        ).toString(),
        decimals: metadatas[index].decimals,
        symbol: metadatas[index].symbol,
      }));

      const result = await depositMutation.mutateAsync({
        fundingAccId: values.funding,
        poolId: values.poolId,
        tokens,
        slippagePercent: stableLike ? Number(values.slippage) : undefined,
      });

      toast.success(
        `Liquidity deposit requests created for ${getRefPoolKindLabel(
          result.poolKind,
        )} pool #${values.poolId} (${result.method}).`,
      );
    } catch (error) {
      console.error("Error creating liquidity deposit requests:", error);
      toast.error(
        `Failed to create liquidity deposit requests: ${
          (error as Error).message
        }`,
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <SenderFormField
          isLoading={walletsQuery.isLoading}
          wallets={walletsQuery.data?.filter((w) => !w.isLockup)}
          name="funding"
          control={form.control}
          rules={{
            required: "Please select a wallet.",
          }}
          description="Funding wallet."
          placeholder="Select a wallet"
          label="Sender"
        />

        <DropdownFormField
          isLoading={liquidityPoolsQuery.isLoading}
          items={liquidityPoolsQuery.data?.map((pool) => ({
            id: pool.id,
            name: getFormattedPoolBalance(pool),
          }))}
          name="poolId"
          control={form.control}
          rules={{
            required: "Please select a pool.",
          }}
          description="Select a liquidity pool."
          placeholder="NEAR-BTC"
          label="Liquidity pool"
        />

        {selectedPool?.token_symbols.map((symbol, index) => (
          <TokenWithMaxInput
            key={index}
            control={form.control}
            name={`tokenAmounts.${index}`}
            label={`Amount of ${symbol} to deposit in the pool`}
            placeholder="10"
            rules={{ required: true }}
            decimals={userTokensForPool[index]?.decimals || 0}
            maxIndivisible={userTokensForPool[index]?.balance || "0"}
            symbol={symbol}
            onChange={() => setLastUpdatedIndex(index)}
          />
        ))}

        {stableLike && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getRefPoolKindLabel(selectedPool.pool_kind)} pools accept any
              combination of their tokens, including a single one. Leave the
              others at 0 for a one-sided deposit.
            </p>
            <TextInput
              control={form.control}
              name="slippage"
              label="Max slippage (%)"
              placeholder={DEFAULT_LIQUIDITY_SLIPPAGE_PERCENT.toString()}
              description="The request fails on-chain if the pool would mint fewer LP shares than today's estimate minus this margin, for example because the pool rebalanced or its prices moved while signers were confirming. Raise it if confirmations may take a while."
            />
          </>
        )}

        {selectedPool?.token_account_ids.includes("wrap.near") && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            If this wallet needs more wNEAR, NearVault will create a wrap
            request for the shortfall.
          </p>
        )}

        <SwitchInput
          control={form.control}
          name={"enableEmptyPools"}
          label="Enable empty liquidity pools"
          description="Note: enable this option if you want to see empty pools."
          rules={{ required: false }}
        />

        <Button type="submit">Create liquidity deposit request</Button>
      </form>
    </Form>
  );
};

export default RefLiquidityPools;
