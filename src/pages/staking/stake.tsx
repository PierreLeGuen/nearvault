import { type Wallet } from "@prisma/client";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import AllAvailablePools from "~/components/Staking/AllAvailablePools";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { api } from "~/lib/api";
import { calculateLockup } from "~/lib/lockup/lockup";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
}

const Stake: NextPageWithLayout = () => {
  const [selectedWallet, setSelectedWallet] = useState<WalletPretty>();

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
        setSelectedWallet({
          prettyName: data[0].walletAddress,
          walletDetails: data[0],
        });
        setAllWallets([]);

        for (const wallet of data) {
          setAllWallets((prev) => [
            ...prev,
            { prettyName: wallet.walletAddress, walletDetails: wallet },
          ]);
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();
            setAllWallets((prev) => [
              ...prev,
              {
                prettyName: "Lockup of " + wallet.walletAddress,
                walletDetails: {
                  walletAddress: lockupValue,
                  id: lockupValue,
                  teamId: "na",
                },
              },
            ]);
          } catch (_) {}
        }
      },
    }
  );

  if (isLoading || !selectedWallet || !data || allWallets.length == 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex w-36 flex-grow flex-col p-4">
      <div className="max-w-lg">
        <h1 className="text-xl font-semibold">Stake</h1>
        <div className="mt-4 w-full">
          <WalletsDropDown
            wallets={allWallets}
            selectedWallet={selectedWallet}
            setSelectedWallet={setSelectedWallet}
          />
        </div>
        <div className="mt-4 w-full">
          <label className="block text-gray-700">Amount</label>
          <input
            className="mt-2 w-full rounded-lg border px-4 py-2 text-gray-700 focus:outline-none"
            type="text"
            placeholder="Enter amount"
          />
        </div>
        <div>
          <AllAvailablePools />
        </div>
      </div>
    </div>
  );
};

Stake.getLayout = getSidebarLayout;
export default Stake;
