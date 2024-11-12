import { useEffect, useState } from "react";
import { z } from "zod";
import { DropdownFormField } from "~/components/inputs/dropdown";
import { TokenWithMaxInput } from "~/components/inputs/near";
import { SenderFormField } from "~/components/inputs/sender";
import { SwitchInput } from "~/components/inputs/switch";
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
import { type FungibleTokenMetadata } from "~/lib/ft/contract";
import { type Token } from "~/lib/transformations";
import { convertToIndivisibleFormat } from "~/lib/utils";

const formSchema = z.object({
  poolId: z.string(),
  tokenAmounts: z.array(z.string()).length(4),
  enableEmptyPools: z.boolean(),
  funding: z.string(),
});

export const getFormattedPoolBalance = (pool: {
  amounts: string[];
  token_symbols: string[];
  id: string;
}) => {
  return `${pool.token_symbols.join("-")} (${Object.keys(pool.amounts)
    .map((_, idx) => `${pool.amounts[idx]} ${pool.token_symbols[idx]}`)
    .join(" | ")}) ID: ${pool.id}`;
};

export const getUserBalanceForPool = (
  pool?: LiquidityPool,
  userTokens?: Token[],
) => {
  const tokens: (Token | undefined)[] = [];

  if (pool && userTokens) {
    for (let i = 0; i < 4; i++) {
      const token = userTokens.find(
        (t) => t.account_id == pool.token_account_ids[i],
      );
      tokens.push(token);
    }
  }

  return tokens;
};

const RefLiquidityPools = () => {
  const form = useZodForm(formSchema, {
    defaultValues: {
      enableEmptyPools: false,
      tokenAmounts: ["0", "0", "0", "0"],
    },
  });
  const walletsQuery = useTeamsWalletsWithLockups();
  const liquidityPoolsQuery = useGetRefLiquidityPools(
    form.watch("enableEmptyPools"),
  );

  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );
  const liquidityPoolDetailsQuery = useGetLiquidityPoolById(
    form.watch("poolId"),
  );
  const tokenPricesQuery = useGetTokenPrices();
  const depositMutation = useDepositToRefLiquidityPool();

  const userTokensForPool = getUserBalanceForPool(
    liquidityPoolDetailsQuery.data,
    tokensQuery.data,
  );

  const watchedAmounts = form.watch("tokenAmounts");
  const [lastUpdatedIndex, setLastUpdatedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (
      !tokenPricesQuery.data ||
      !liquidityPoolDetailsQuery.data ||
      lastUpdatedIndex === null ||
      !watchedAmounts[lastUpdatedIndex]
    ) {
      return;
    }

    const prices = tokenPricesQuery.data;
    const tokenIds = liquidityPoolDetailsQuery.data.token_account_ids;
    const tokenCount = liquidityPoolDetailsQuery.data.token_symbols.length;
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

  }, [lastUpdatedIndex, watchedAmounts[lastUpdatedIndex]]); // Only depend on the changed value

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);
    const tokenAccIds = liquidityPoolDetailsQuery.data?.token_account_ids;
    const tokenCount = liquidityPoolDetailsQuery.data?.token_symbols.length;

    const metadataPromises = tokenAccIds.slice(0, tokenCount).map((accId) =>
      viewCall<FungibleTokenMetadata>(accId, "ft_metadata", {}),
    );
    const metadatas = await Promise.all(metadataPromises);

    const indivisibleAmounts = values.tokenAmounts.slice(0, tokenCount).map((amount, index) =>
      convertToIndivisibleFormat(amount, metadatas[index].decimals),
    );

    console.log(
      indivisibleAmounts,
      values.poolId,
      tokenAccIds,
      values.funding,
    );

    await depositMutation.mutateAsync({
      fundingAccId: values.funding,
      tokenAccIds: tokenAccIds.slice(0, tokenCount),
      tokenAmounts: indivisibleAmounts.map((amt) => amt.toString()),
      poolId: values.poolId,
    });
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

        {liquidityPoolDetailsQuery.data?.token_symbols.map((symbol, index) => (
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
