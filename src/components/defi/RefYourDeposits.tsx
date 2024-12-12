import BigNumber from "bignumber.js";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { z } from "zod";
import {
  useGetRefLiquidityPoolsForAccount,
  useGetRefPoolShares,
  usePredictRemoveLiquidity,
  useRemoveLiquidity,
  type LiquidityPoolRef
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { fetchJson } from "~/lib/client";
import { DropdownFormField } from "../inputs/dropdown";
import { SenderFormField } from "../inputs/sender";
import { SharesInput } from "../inputs/share-max";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { getFormattedPoolBalance } from "./RefLiquidityPools";

const depositForm = z.object({
  poolId: z.string(),
  funding: z.string(),
  sharesToWithdraw: z.string(),
});

export const RefYourDeposits = () => {
  const form = useZodForm(depositForm);

  const poolsQuery = useGetRefLiquidityPoolsForAccount(form.watch("funding"));
  const mySharesQuery = useGetRefPoolShares(
    form.watch("poolId"),
    form.watch("funding"),
  );
  const predictRemoveLiquidityQuery = usePredictRemoveLiquidity({
    poolId: form.watch("poolId"),
    shares: form.watch("sharesToWithdraw"),
  });
  const walletsQuery = useTeamsWalletsWithLockups();
  const removeLiquidityMut = useRemoveLiquidity();

  useEffect(() => {
    // reset shares to withdraw to 0 when poolId changes
    form.setValue("sharesToWithdraw", "0");
  }, [form.watch("poolId")]);

  const onSubmit = async (values: z.infer<typeof depositForm>) => {
    const endpoint =
      "https://api.ref.finance/liquidity-pools/" + values.funding;
    const pools = await fetchJson<LiquidityPoolRef[]>(endpoint);
    const selectedPool = pools.find((p) => p.id === values.poolId);

    if (!selectedPool) {
      throw new Error("Pool not found");
    }


    try {
      await removeLiquidityMut.mutateAsync({
        fundingAccId: values.funding,
        poolId: parseInt(values.poolId),
        shares: form.watch("sharesToWithdraw"),
        minAmounts: selectedPool.token_account_ids.map(() => "0"),
      });

      toast.success("Remove liquidity request created");
    } catch (error) {
      toast.error("Error creating remove liquidity request");
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
          isLoading={poolsQuery.isLoading}
          items={poolsQuery.data?.map((pool) => ({
            id: pool.id,
            name: getFormattedPoolBalance(pool),
          }))}
          name="poolId"
          control={form.control}
          rules={{
            required: "Please select a pool.",
          }}
          description="Select a liquidity pool. Pools with very low balance can be ignored."
          placeholder="NEAR-BTC"
          label="Liquidity pool"
        />
        {/* Available shares : */}
        {mySharesQuery.data && (
          <div>
            <p>
              Shares:{" "}
              {BigNumber(mySharesQuery.data).toFixed(0)}
            </p>
          </div>
        )}

        <SharesInput
          name="sharesToWithdraw"
          control={form.control}
          label="Amount of shares to withdraw"
          maxIndivisible={BigNumber(mySharesQuery.data)
            .toFixed(0)}
          description="Enter the amount of shares you want to withdraw."
          defaultValue="0"
        />

        {/* Remaining shares */}
        {mySharesQuery.data && (
          <div>
            <p>
              Remaining shares:{" "}
              {BigNumber(mySharesQuery.data)
                .minus(
                  BigNumber(form.watch("sharesToWithdraw")),
                )
                .toFixed(0)}
            </p>
          </div>
        )}

        {predictRemoveLiquidityQuery.data && poolsQuery.data && (
          <div className="space-y-2">
            <h3 className="font-medium">Predicted tokens to receive:</h3>
            {predictRemoveLiquidityQuery.data.map((amount, index) => {
              const pool = poolsQuery.data.find(p => p.id === form.watch("poolId"));
              if (!pool) return null;

              const displayAccountId = pool.token_account_ids[index].length > 30
                ? `${pool.token_account_ids[index].slice(0, 30)}...`
                : pool.token_account_ids[index];

              return (
                <div key={pool.token_account_ids[index]} className="flex justify-between">
                  <span>{`${pool.symbols[index]} (${displayAccountId})`}:</span>
                  <span>{BigNumber(amount).div(10 ** pool.decimals[index]).toFixed(4)}</span>
                </div>
              );
            })}
          </div>
        )}

        <Button type="submit">Create remove liquidity request</Button>
      </form>
    </Form>
  );
};
