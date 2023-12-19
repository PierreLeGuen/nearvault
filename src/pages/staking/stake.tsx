import { type Wallet } from "@prisma/client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { getSidebarLayout } from "~/components/Layout";
import { NumberInput } from "~/components/inputs/number";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useZodForm } from "~/hooks/form";
import {
  useAddRequestStakeToPool,
  useIsPoolSelected,
  useListAllStakingPoolsWithDetails,
} from "~/hooks/staking";
import { useTeamsWalletsWithLockups } from "~/hooks/teams";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
  isLockup: boolean;
  ownerAccountId: string | undefined;
}

const formSchema = z.object({
  fromWallet: z.string(),
  amountNear: z.number().min(0),
  poolId: z.string(),
});

const Stake: NextPageWithLayout = () => {
  const { data: pools, isLoading } = useListAllStakingPoolsWithDetails();

  const [filteredPools, setFilteredPools] = useState(new Map());
  const listWallets = useTeamsWalletsWithLockups();

  const form = useZodForm(formSchema);
  const watchedWallet = form.watch("fromWallet");
  const wallet = listWallets.data?.find(
    (w) => w.walletDetails.walletAddress === watchedWallet,
  );

  const addRequestStakeToPool = useAddRequestStakeToPool();
  const isPoolSelected = useIsPoolSelected(wallet);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    addRequestStakeToPool.mutate({
      selectedWallet: wallet,
      poolId: values.poolId,
      amountNear: values.amountNear,
    });
  }

  useEffect(() => {
    if (!pools) {
      return;
    }

    if (!wallet || !wallet.isLockup) {
      setFilteredPools(pools);
    }
    if (!isPoolSelected.data || isPoolSelected.data === "") {
      setFilteredPools(pools);
    }
    if (isPoolSelected.data && isPoolSelected.data !== "") {
      setFilteredPools(
        new Map([[isPoolSelected.data, pools.get(isPoolSelected.data)]]),
      );
    }
  }, [pools, watchedWallet]);

  if (isLoading || !filteredPools) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-grow flex-col gap-10 px-36 py-10">
      <HeaderTitle level="h1" text="Stake" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <SenderFormField
            isLoading={listWallets.isLoading}
            wallets={listWallets.data}
            name="fromWallet"
            control={form.control}
            rules={{
              required: "Please select a wallet.",
            }}
            description="Wallet to stake from."
            placeholder="Select a wallet"
            label="Sender"
          />
          <NumberInput
            control={form.control}
            name="amountNear"
            label="Amount to stake in NEAR"
            placeholder="10"
            rules={{ required: true }}
            disabled={false}
          />
          <div className="rounded-md border shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pool ID</TableHead>
                  <TableHead>Fees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from(filteredPools).map((key, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="break-all">{key[1].id}</p>
                    </TableCell>
                    <TableCell>
                      <p className="break-all">{`${key[1].fees}%`}</p>
                    </TableCell>
                    <TableCell>
                      <p className="break-all capitalize">{key[1].status}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="submit"
                        onClick={() => form.setValue("poolId", key[1].id)}
                      >
                        <div className="inline-flex items-center">
                          {wallet && wallet.isLockup && !isPoolSelected.data
                            ? "Select pool"
                            : "Create stake request"}
                        </div>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </form>
      </Form>
    </div>
  );
};

Stake.getLayout = getSidebarLayout;
export default Stake;
