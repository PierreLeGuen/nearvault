import BigNumber from "bignumber.js";
import { z } from "zod";
import {
  useGetRefLiquidityPoolsForAccount,
  useGetRefPoolShares,
  useWithdrawFromRefLiquidityPool,
  type LiquidityPoolRef,
} from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { fetchJson, viewCall } from "~/lib/client";
import { getFtMetadataForAccounts } from "~/lib/utils";
import { DropdownFormField } from "../inputs/dropdown";
import { SenderFormField } from "../inputs/sender";
import { SharesInput } from "../inputs/share-max";
import { Button } from "../ui/button";
import { Form } from "../ui/form";
import { getFormattedPoolBalance } from "./RefLiquidityPools";

const depositForm = z.object({
  poolId: z.string(),
  funding: z.string(),
  amounts: z.array(z.string()),
});

export const RefYourDeposits = () => {
  const form = useZodForm(depositForm);

  const poolsQuery = useGetRefLiquidityPoolsForAccount(form.watch("funding"));
  const sharesQuery = useGetRefPoolShares(
    form.watch("poolId"),
    form.watch("funding"),
  );
  const walletsQuery = useTeamsWalletsWithLockups();
  const withdrawQuery = useWithdrawFromRefLiquidityPool();
  const amounts = (form.watch("amounts") || []).map((a) =>
    a != "" ? new BigNumber(a) : BigNumber(0),
  );

  const onSubmit = async (values: z.infer<typeof depositForm>) => {
    const endpoint =
      "https://api.ref.finance/liquidity-pools/" + values.funding;
    const pools = await fetchJson<LiquidityPoolRef[]>(endpoint);
    const selectedPool = pools.find((p) => p.id === values.poolId);

    if (!selectedPool) {
      throw new Error("Pool not found");
    }

    const ftMetadata = await getFtMetadataForAccounts(
      selectedPool.token_account_ids,
    );

    const amountsArgs = amounts.map((amount, idx) => {
      const accId = selectedPool.token_account_ids[idx];
      const metadata = ftMetadata.find((m) => m.accountId === accId);
      return amount.multipliedBy(10 ** metadata.decimals).toFixed(0);
    });

    const burn = await viewCall<string>(
      "v2.ref-finance.near",
      "predict_remove_liquidity_by_tokens",
      {
        pool_id: parseInt(values.poolId),
        amounts: amountsArgs,
      },
    );

    const slippage = 0.001; // 0.1%
    const burnBn = BigNumber(burn).multipliedBy(1 + slippage);

    withdrawQuery.mutate({
      poolId: parseInt(values.poolId),
      tokens: selectedPool.token_account_ids,
      amounts: amountsArgs,
      maxSharesBurn: burnBn.toFixed(0),
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
        {/* Available shares : */}
        {sharesQuery.data && (
          <div>
            <p>
              Shares:{" "}
              {BigNumber(sharesQuery.data)
                .div(10 ** 24)
                .toFixed(4)}
            </p>
          </div>
        )}

        {poolsQuery.data
          ?.find((p) => p.id === form.watch("poolId"))
          ?.token_account_ids.map((tokenId, idx) => (
            <SharesInput
              key={tokenId}
              name={`amounts.${idx}`}
              control={form.control}
              label={`Amount of ${tokenId}`}
              maxIndivisible={BigNumber(sharesQuery.data)
                .div(10 ** 24)
                .toFixed(4)}
              description={`Enter the amount of ${tokenId} you want to withdraw.`}
              defaultValue="0"
            />
          ))}

        {/* Remaining shares */}
        {sharesQuery.data && (
          <div>
            <p>
              Remaining shares:{" "}
              {BigNumber(sharesQuery.data)
                .div(10 ** 24)

                .minus(
                  BigNumber(amounts.reduce((a, b) => a.plus(b), BigNumber(0))),
                )
                .toFixed(4)}
            </p>
          </div>
        )}
        {/* Withdrawing x shares */}
        <p>
          Withdrawing{" "}
          {BigNumber(amounts.reduce((a, b) => a.plus(b), BigNumber(0))).toFixed(
            4,
          )}{" "}
          shares
        </p>

        <Button type="submit">Create remove liquidity request</Button>
      </form>
    </Form>
  );
};
