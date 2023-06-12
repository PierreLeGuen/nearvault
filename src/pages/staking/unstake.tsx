import { type Wallet } from "@prisma/client";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import AllStaked from "~/components/Staking/AllStaked";
import { api } from "~/lib/api";
import { calculateLockup } from "~/lib/lockup/lockup";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
}

const Unstake: NextPageWithLayout = () => {
  const { newNearConnection } = usePersistingStore();
  const { currentTeam } = usePersistingStore();
  const [allWallets, setAllWallets] = useState<WalletPretty[]>([]);

  const { data, isLoading } = api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    {
      enabled: true,
      async onSuccess(data) {
        if (!data || data.length == 0 || data[0] === undefined) {
          return;
        }

        const walletPromises = data.map(async (wallet) => {
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();

            return [
              { prettyName: wallet.walletAddress, walletDetails: wallet },
              {
                prettyName: "Lockup of " + wallet.walletAddress,
                walletDetails: {
                  walletAddress: lockupValue,
                  id: lockupValue,
                  teamId: "na",
                },
              },
            ];
          } catch (_) {
            return [
              { prettyName: wallet.walletAddress, walletDetails: wallet },
            ];
          }
        });

        const walletPairs = await Promise.all(walletPromises);
        setAllWallets(walletPairs.flat());
      },
    }
  );

  if (isLoading || !data || allWallets.length == 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-36 flex-grow flex-col p-4">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold">Unstake</h1>
        <AllStaked wallets={allWallets} />
      </div>
    </div>
  );
};

Unstake.getLayout = getSidebarLayout;
export default Unstake;
