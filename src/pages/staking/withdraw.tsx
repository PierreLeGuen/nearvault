import { formatNearAmount } from "near-api-js/lib/utils/format";
import { useEffect, useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { WalletData } from "~/components/Staking/AllStaked";
import { WithdrawDialog } from "~/components/dialogs/WithdrawDialog";
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
    const data = getStakingDetailsForWallets.data;
    console.log(data);

    if (!data) {
      return;
    }
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

  if (getStakingDetailsForWallets.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-grow flex-col gap-10 px-36 py-10">
        <HeaderTitle level="h1" text="Withdraw" />
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
