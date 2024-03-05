import BigNumber from "bignumber.js";
import { z } from "zod";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import {
  getFormattedPoolBalance,
  getUserBalanceForPool,
} from "~/components/defi/RefLiquidityPools";
import { DropdownFormField } from "~/components/inputs/dropdown";
import { TokenWithMaxInput } from "~/components/inputs/near";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import HeaderTitle from "~/components/ui/header";
import {
  useDepositToRefStableLiquidityPool,
  useGetRefLiquidityPools,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { getRatedPool } from "~/lib/client";
import { convertToIndivisibleFormat } from "~/lib/utils";
import { type NextPageWithLayout } from "../_app";

const formSchema = z.object({
  poolId: z.string(),
  funding: z.string(),
  tokens: z
    .array(
      z.object({
        amount: z.string(),
      }),
    )
    .optional(),
});

const StablePoolsRefDeposit: NextPageWithLayout = () => {
  const form = useZodForm(formSchema);

  const depositStableMutation = useDepositToRefStableLiquidityPool();
  const poolsQuery = useGetRefLiquidityPools(true, "RATED_SWAP");
  const walletsQuery = useTeamsWalletsWithLockups();
  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );

  const currentPool = poolsQuery.data?.find(
    (p) => p.id === form.watch("poolId"),
  );

  const userBalance = getUserBalanceForPool(currentPool, tokensQuery.data);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);

    // shares_total_supply/sum(c_amounts)*your token amount;
    // near contract call-function as-read-only v2.ref-finance.near get_rated_pool json-args '{"pool_id":4179}' network-config mainnet now
    const ratedPool = await getRatedPool(parseInt(values.poolId));
    const shares_total_supply = BigNumber(ratedPool.shares_total_supply);
    const c_amounts = ratedPool.c_amounts.map((a) => BigNumber(a));
    // sum(c_amounts)
    const sum_c_amounts = c_amounts.reduce((a, b) => a.plus(b));
    console.log("sum,", sum_c_amounts.toString());
    console.log("shares_total_supply", shares_total_supply.toString());

    let min_shares = BigNumber(0);
    for (let idx = 0; idx < values.tokens.length; idx++) {
      const decimals = ratedPool.decimals[idx];
      // const token_amount = convertToIndivisibleFormat(
      //   values.tokens[idx].amount,
      //   decimals,
      // );
      const token_amount = BigNumber(values.tokens[idx].amount);
      console.log(token_amount.toString());
      const l = shares_total_supply.dividedBy(sum_c_amounts);
      console.log("div", l.toString());

      const min_amount = l.multipliedBy(BigNumber(token_amount.toString()));
      console.log(min_amount.toString());

      min_shares = min_shares.plus(min_amount);
    }
    // put to indisible format
    const min_shares_bn = convertToIndivisibleFormat(min_shares.toString(), 24);
    console.log(min_shares_bn.toString());

    debugger;

    depositStableMutation.mutate({
      amounts: values.tokens.map((t, idx) =>
        convertToIndivisibleFormat(
          t.amount,
          ratedPool.decimals[idx],
        ).toString(),
      ),
      poolId: parseInt(values.poolId),
      fundingAccId: values.funding,
      shares: min_shares_bn.toString(),
      tokens: currentPool.token_account_ids,
    });
  };

  return (
    <ContentCentered>
      <HeaderTitle level="h1">Deposit to Stable Pools</HeaderTitle>
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
            description="Select a liquidity pool."
            placeholder="NEAR-BTC"
            label="Liquidity pool"
          />

          {currentPool?.token_symbols.map((symbol, i) => (
            <TokenWithMaxInput
              key={currentPool.token_account_ids[i]}
              control={form.control}
              name={`tokens.${i}.amount`}
              label={`Amount of ${symbol} to deposit in the pool`}
              placeholder="10"
              decimals={userBalance[i]?.decimals || 0}
              maxIndivisible={userBalance[i]?.balance || "0"}
              symbol={symbol}
              defaultValue="0"
            />
          ))}

          {form.formState.errors && (
            <div className="text-red-500">
              {JSON.stringify(form.formState.errors)}
            </div>
          )}
          <Button type="submit">Create liquidity deposit request</Button>
        </form>
      </Form>
    </ContentCentered>
  );
};

StablePoolsRefDeposit.getLayout = getSidebarLayout;

export default StablePoolsRefDeposit;
