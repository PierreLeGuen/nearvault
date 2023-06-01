import { Beneficiary, Wallet } from "@prisma/client";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import BeneficiariesDropDown from "~/components/Payments/BeneficiariesDropDown";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { api } from "~/lib/api";
import { calculateLockup } from "~/lib/lockup/lockup";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
}

const Transfers: NextPageWithLayout = () => {
  const [teamsWallet, setTeamsWallet] = useState<WalletPretty[]>([]);

  const [fromWallet, setFromWallet] = useState<WalletPretty>();
  const [toBenef, setToBenef] = useState<Beneficiary>();
  const [currency, setCurrency] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [memo, setMemo] = useState<string>("");

  const { currentTeam, newNearConnection } = usePersistingStore();

  const { isLoading } = api.teams.getWalletsForTeam.useQuery(
    {
      teamId: currentTeam?.id || "",
    },
    {
      enabled: true,
      async onSuccess(data) {
        if (!data || data.length == 0 || data[0] === undefined) {
          throw new Error("No wallets found");
        }
        const w: WalletPretty[] = [];
        for (const wallet of data) {
          w.push({ walletDetails: wallet, prettyName: wallet.walletAddress });
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();

            w.push({
              prettyName: "Lockup of " + wallet.walletAddress,
              walletDetails: {
                walletAddress: lockupValue,
                id: lockupValue,
                teamId: "na",
              },
            });
          } catch (_) {}
        }
        setTeamsWallet(w);
        setFromWallet(w[0]);
      },
    }
  );

  const { data: beneficiaries, isLoading: isLoadingBenef } =
    api.teams.getBeneficiariesForTeam.useQuery({
      teamId: currentTeam?.id || "",
    });

  if (isLoading || !teamsWallet || isLoadingBenef) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <div>From Wallet: DROPDOWN</div>
        <WalletsDropDown
          wallets={teamsWallet}
          selectedWallet={fromWallet}
          setSelectedWallet={setFromWallet}
        />
        <div>To Wallet: Beneficiaries</div>
        <BeneficiariesDropDown
          beneficiaries={beneficiaries}
          selectedBeneficiary={toBenef}
          setSelectedBeneficiary={setToBenef}
        />
        <span>
          Currency
          <input type="text" placeholder="Enter amount" />
        </span>
      </div>
    </>
  );
};

Transfers.getLayout = getSidebarLayout;

export default Transfers;
