import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import AllWithdrawAvailable from "~/components/Staking/AllWithdrawAvailable";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { type WalletPretty } from "./stake";
import { onSuccessGetWallets } from "./unstake";

const WithdrawFromStakingPool: NextPageWithLayout = () => {
  const { newNearConnection, currentTeam } = usePersistingStore();
  const [allWallets, setAllWallets] = useState<WalletPretty[]>([]);

  const { isLoading } = api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    {
      enabled: true,
      async onSuccess(data) {
        await onSuccessGetWallets(data, newNearConnection(), setAllWallets);
      },
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <AllWithdrawAvailable wallets={allWallets} />
    </div>
  );
};

WithdrawFromStakingPool.getLayout = getSidebarLayout;
export default WithdrawFromStakingPool;
