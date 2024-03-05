import BigNumber from "bignumber.js";
import { z } from "zod";
import {
  useGetRefLiquidityPoolsForAccount,
  useWithdrawFromRefLiquidityPool,
  type LiquidityPoolRef,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { fetchJson, viewCall } from "~/lib/client";
import { DropdownFormField } from "../inputs/dropdown";
import { SenderFormField } from "../inputs/sender";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { getFormattedPoolBalance } from "./RefLiquidityPools";

const depositForm = z.object({
  poolId: z.string(),
  funding: z.string(),
});

export const RefYourDeposits = () => {
  const form = useZodForm(depositForm);

  const poolsQuery = useGetRefLiquidityPoolsForAccount(form.watch("funding"));
  const walletsQuery = useTeamsWalletsWithLockups();
  const withdrawQuery = useWithdrawFromRefLiquidityPool();

  const onSubmit = async (values: z.infer<typeof depositForm>) => {
    const endpoint =
      "https://indexer.ref.finance/liquidity-pools/" + values.funding;
    const pools = await fetchJson<LiquidityPoolRef[]>(endpoint);
    const selectedPool = pools.find((p) => p.id === values.poolId);

    if (!selectedPool) {
      throw new Error("Pool not found");
    }
    const shares = await viewCall<string>(
      "v2.ref-finance.near",
      "get_pool_shares",
      {
        pool_id: parseInt(values.poolId),
        account_id: values.funding,
      },
    );
    const slippage = 0.05;

    const sharesbn = new BigNumber(shares);
    const shares_total_supply = new BigNumber(selectedPool.shares_total_supply);

    // your share/shares_total_supply*token A amount*(1-slippage)
    const amounts = selectedPool.amounts.map((amount) => {
      return sharesbn
        .div(shares_total_supply)
        .multipliedBy(BigNumber(amount))
        .multipliedBy(BigNumber(1).minus(BigNumber(slippage)))
        .toFixed(0);
    });

    withdrawQuery.mutate({
      poolId: parseInt(values.poolId),
      tokens: selectedPool.token_account_ids,
      amounts: amounts.map((a) => a.toString()),
      shares: shares,
      fundingAccId: values.funding,
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

        <Button type="submit">Create remove liquidity request</Button>
      </form>
    </Form>
  );
};
