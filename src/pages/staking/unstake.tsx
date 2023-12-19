import { type Wallet } from "@prisma/client";
import { type Near } from "near-api-js";
import { formatNearAmount } from "near-api-js/lib/utils/format";
import { z } from "zod";
import { getSidebarLayout } from "~/components/Layout";
import { UnstakeDialog } from "~/components/dialogs/unstake";
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
import { useGetStakingDetailsForWallets as useGetStakingDetailsForTeamsWallets } from "~/hooks/staking";
import { calculateLockup } from "~/lib/lockup/lockup";
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

export const onSuccessGetWallets = async (
  data: Wallet[],
  near: Promise<Near>,
  setWalletsFn: (wallets: WalletPretty[]) => void,
) => {
  if (!data || data.length == 0 || data[0] === undefined) {
    return;
  }

  const walletPromises = data.map(async (wallet) => {
    try {
      const lockupValue = calculateLockup(wallet.walletAddress, "lockup.near");
      await (await (await near).account(lockupValue)).state();

      return [
        {
          prettyName: wallet.walletAddress,
          walletDetails: wallet,
          isLockup: false,
          ownerAccountId: undefined,
        },
        {
          prettyName: "Lockup of " + wallet.walletAddress,
          walletDetails: {
            walletAddress: lockupValue,
            id: lockupValue,
            teamId: "na",
          },
          isLockup: true,
          ownerAccountId: wallet.walletAddress,
        },
      ];
    } catch (_) {
      return [
        {
          prettyName: wallet.walletAddress,
          walletDetails: wallet,
          isLockup: false,
          ownerAccountId: undefined,
        },
      ];
    }
  });

  const walletPairs = await Promise.all(walletPromises);
  setWalletsFn(walletPairs.flat());
};

const Unstake: NextPageWithLayout = () => {
  const form = useZodForm(formSchema);
  const getStakingDetailsForWallets = useGetStakingDetailsForTeamsWallets();

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  if (getStakingDetailsForWallets.isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="flex flex-grow flex-col gap-10 px-36 py-10">
        <HeaderTitle level="h1" text="Unstake" />
        {getStakingDetailsForWallets.data?.map((walletData) => (
          <div key={walletData.wallet.walletDetails.walletAddress}>
            <HeaderTitle level="h2" text={walletData.wallet.prettyName} />
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
        ))}
      </div>
    </>
  );
};

Unstake.getLayout = getSidebarLayout;
export default Unstake;
