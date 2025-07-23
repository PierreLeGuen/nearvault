import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { WalletData } from "~/components/Staking/AllStaked";
import { WithdrawDialog } from "~/components/dialogs/WithdrawDialog";
import { Button } from "~/components/ui/button";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useGetStakingDetailsForWallets as useGetStakingDetailsForTeamsWallets } from "~/hooks/staking";
import { type NextPageWithLayout } from "../_app";

const WithdrawFromStakingPool: NextPageWithLayout = () => {
  const getStakingDetailsForWallets = useGetStakingDetailsForTeamsWallets();
  const [filteredPools, setFilteredPools] = useState<WalletData[]>([]);

  useEffect(() => {
    const result = getStakingDetailsForWallets.data;
    console.log("Staking data result:", result);

    if (!result) {
      return;
    }

    const data = result.walletData;
    const tmp = data
      .map((walletData) => {
        const poolsForWallet = walletData.stakedPools
          .map((pool) => {
            if (!pool.withdraw_available || pool.withdraw_available === "0") {
              return;
            }

            return pool;
          })
          .filter(Boolean);
        console.log("poolsForWallet", poolsForWallet);

        return {
          wallet: walletData.wallet,
          stakedPools: poolsForWallet,
        };
      })
      .filter((walletData) => walletData.stakedPools.length > 0);
    setFilteredPools(tmp);
  }, [getStakingDetailsForWallets.data]);

  const handleRetry = () => {
    getStakingDetailsForWallets.refetch();
  };

  if (getStakingDetailsForWallets.isLoading) {
    return (
      <div className="flex flex-grow flex-col gap-10 px-36 py-10">
        <HeaderTitle level="h1" text="Withdraw" />
        <div className="text-gray-500">Loading staking data...</div>
      </div>
    );
  }

  if (getStakingDetailsForWallets.isError) {
    return (
      <div className="flex flex-grow flex-col gap-10 px-36 py-10">
        <HeaderTitle level="h1" text="Withdraw" />
        <div className="space-y-4">
          <div className="text-red-500">
            Error loading staking data:{" "}
            {getStakingDetailsForWallets.error?.message || "Unknown error"}
          </div>
          <Button onClick={handleRetry} variant="outline">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  const errors = getStakingDetailsForWallets.data?.errors || [];
  const hasRateLimitErrors = errors.some(
    (error) =>
      error.error.includes("Rate limit") || error.error.includes("rate limit"),
  );

  return (
    <>
      <div className="flex flex-grow flex-col gap-10 px-36 py-10">
        <HeaderTitle level="h1" text="Withdraw" />

        {errors.length > 0 && (
          <div
            className={`rounded-md border p-4 ${
              hasRateLimitErrors
                ? "border-orange-200 bg-orange-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p
                  className={`mb-2 font-semibold ${
                    hasRateLimitErrors ? "text-orange-700" : "text-red-700"
                  }`}
                >
                  Failed to load staking data for {errors.length} wallet
                  {errors.length > 1 ? "s" : ""}:
                </p>
                {hasRateLimitErrors && (
                  <p className="mb-2 text-sm text-orange-600">
                    ⚠️ Rate limit reached. Please wait a moment before retrying
                    to avoid being temporarily blocked.
                  </p>
                )}
                <ul className="list-inside list-disc space-y-1">
                  {errors.map((error, index) => (
                    <li
                      key={`${error.walletAddress}-${index}`}
                      className={`text-sm ${
                        error.error.includes("Rate limit")
                          ? "text-orange-600"
                          : "text-red-600"
                      }`}
                    >
                      <span className="font-medium">{error.wallet}:</span>{" "}
                      {error.error}
                    </li>
                  ))}
                </ul>
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="ml-4"
                disabled={getStakingDetailsForWallets.isFetching}
              >
                {getStakingDetailsForWallets.isFetching
                  ? "Retrying..."
                  : "Retry"}
              </Button>
            </div>
          </div>
        )}

        {getStakingDetailsForWallets.isFetching && (
          <div className="text-gray-500">Refreshing data...</div>
        )}

        {filteredPools.length === 0 && errors.length === 0 && (
          <div className="text-gray-500">
            No wallets have tokens available for withdrawal. You need to unstake
            tokens first before you can withdraw them.
          </div>
        )}

        {filteredPools.map((walletData) => (
          <div key={walletData.wallet.walletDetails.walletAddress}>
            <HeaderTitle level="h2" text={walletData.wallet.prettyName} />
            <div className="rounded-md border shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] truncate">
                      Pool ID
                    </TableHead>
                    <TableHead>Ready to withdraw</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(walletData.stakedPools).map((pool, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <p className="break-all">{pool.validator_id}</p>
                      </TableCell>
                      <TableCell>
                        <p className="break-all">{`${formatNearAmount(
                          pool.withdraw_available,
                        )} Ⓝ`}</p>
                      </TableCell>
                      <TableCell className="text-right">
                        <WithdrawDialog
                          pool={pool}
                          wallet={walletData.wallet}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

WithdrawFromStakingPool.getLayout = getSidebarLayout;
export default WithdrawFromStakingPool;
