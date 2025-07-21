import { type Wallet } from "@prisma/client";
import { useEffect, useState } from "react";
import { z } from "zod";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { NumberInput } from "~/components/inputs/number";
import { SenderFormField } from "~/components/inputs/sender";
import { TextInput } from "~/components/inputs/text";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import HeaderTitle from "~/components/ui/header";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
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
  poolId: z.string().optional(),
  useManualPool: z.boolean().default(false),
  manualPoolId: z.string().optional(),
});

const Stake: NextPageWithLayout = () => {
  const { data: pools, isLoading } = useListAllStakingPoolsWithDetails();

  const [filteredPools, setFilteredPools] = useState(new Map());
  const [useManualPool, setUseManualPool] = useState(false);
  const listWallets = useTeamsWalletsWithLockups();

  const form = useZodForm(formSchema);
  const watchedWallet = form.watch("fromWallet");
  const wallet = listWallets.data?.find(
    (w) => w.walletDetails.walletAddress === watchedWallet,
  );

  const addRequestStakeToPool = useAddRequestStakeToPool();
  const isPoolSelected = useIsPoolSelected(wallet);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate pool selection
    if (values.useManualPool && !values.manualPoolId) {
      form.setError("manualPoolId", {
        type: "manual",
        message: "Please enter a pool ID",
      });
      return;
    }
    
    if (!values.useManualPool && !values.poolId) {
      // Show a general error message since poolId is set by clicking table buttons
      alert("Please select a pool from the list");
      return;
    }
    
    const poolId = values.useManualPool && values.manualPoolId 
      ? values.manualPoolId 
      : values.poolId;
      
    addRequestStakeToPool.mutate({
      selectedWallet: wallet,
      poolId: poolId!,
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
  }, [isPoolSelected.data, pools, wallet, watchedWallet]);

  if (isLoading || !filteredPools) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Stake" />
        Loading...
      </ContentCentered>
    );
  }

  return (
    <ContentCentered>
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
          
          {/* Manual Pool Entry Section */}
          <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="manual-pool-toggle">Manual Pool Entry</Label>
                <p className="text-sm text-gray-600">
                  Enter a pool ID manually if it's not in the list
                </p>
              </div>
              <Switch
                id="manual-pool-toggle"
                checked={useManualPool}
                onCheckedChange={(checked) => {
                  setUseManualPool(checked);
                  form.setValue("useManualPool", checked);
                  if (!checked) {
                    form.setValue("manualPoolId", "");
                  }
                }}
              />
            </div>
            
            {useManualPool && (
              <div className="space-y-2">
                <TextInput
                  control={form.control}
                  name="manualPoolId"
                  label="Pool ID"
                  placeholder="example.pool.near"
                  rules={{ 
                    required: useManualPool ? "Pool ID is required" : false,
                    pattern: {
                      value: /^[a-z0-9-_.]+$/,
                      message: "Invalid pool ID format"
                    }
                  }}
                  description="Enter the exact pool ID (e.g., zavodil.poolv1.near)"
                />
                <p className="text-sm text-yellow-600">
                  ⚠️ Warning: Make sure you enter the correct pool ID. Invalid pool IDs may result in failed transactions.
                </p>
              </div>
            )}
          </div>

          {!useManualPool && (
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
                        type="button"
                        onClick={() => {
                          form.setValue("poolId", key[1].id);
                          form.handleSubmit(onSubmit)();
                        }}
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
          )}
          
          {useManualPool && (
            <Button type="submit" className="w-full">
              Create stake request with manual pool
            </Button>
          )}
        </form>
      </Form>
    </ContentCentered>
  );
};

Stake.getLayout = getSidebarLayout;
export default Stake;
