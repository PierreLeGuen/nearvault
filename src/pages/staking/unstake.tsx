import { type Wallet } from "@prisma/client";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { UnstakeDialog } from "~/components/dialogs/UnstakeDialog";
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

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
  isLockup: boolean;
  ownerAccountId: string | undefined;
}

const Unstake: NextPageWithLayout = () => {
  const getStakingDetailsForWallets = useGetStakingDetailsForTeamsWallets();

  if (getStakingDetailsForWallets.isLoading) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Unstake" />
        Loading...
      </ContentCentered>
    );
  }

  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Unstake" />
      {getStakingDetailsForWallets.data?.map((walletData) => (
        <div key={walletData.wallet.walletDetails.walletAddress}>
          <HeaderTitle level="h2" text={walletData.wallet.prettyName} />
          <div className="rounded-md border shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] truncate">Pool ID</TableHead>
                  <TableHead>Deposit</TableHead>
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
                        pool.deposit,
                      )} Ⓝ`}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <UnstakeDialog pool={pool} wallet={walletData.wallet} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </ContentCentered>
  );
};

Unstake.getLayout = getSidebarLayout;
export default Unstake;
