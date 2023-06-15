import { type Wallet } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import {
  formatNearAmount,
  parseNearAmount,
} from "near-api-js/lib/utils/format";
import { useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import AllAvailablePools from "~/components/Staking/AllAvailablePools";
import WalletsDropDown from "~/components/Staking/WalletsDropDown";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import { initLockupContract } from "~/lib/lockup/contract";
import { calculateLockup } from "~/lib/lockup/lockup";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export interface WalletPretty {
  prettyName: string;
  walletDetails: Wallet;
  isLockup: boolean;
  ownerAccountId: string | undefined;
}

const Stake: NextPageWithLayout = () => {
  const { newNearConnection, currentTeam } = usePersistingStore();
  const walletSelector = useWalletSelector();

  const [selectedWallet, setSelectedWallet] = useState<WalletPretty>();
  const [allWallets, setAllWallets] = useState<WalletPretty[]>([]);
  const [amount, setAmount] = useState<string>("");
  const [stakingInProgress, setStakingInProgress] = useState<{
    [poolId: string]: boolean;
  }>({});

  const addRequestStakeToPool = async (poolId: string) => {
    try {
      if (!selectedWallet) {
        throw new Error("No wallet selected");
      }
      setStakingInProgress((prev) => ({ ...prev, [poolId]: true }));

      await assertCorrectMultisigWallet(
        walletSelector,
        selectedWallet.walletDetails.walletAddress
      );
      const w = await walletSelector.selector.wallet();

      const ftArgs = {
        amount: parseNearAmount(amount),
      };

      if (selectedWallet.isLockup) {
        if (!selectedWallet.ownerAccountId) {
          throw new Error("No owner account id");
        }

        await w.signAndSendTransaction({
          receiverId: selectedWallet.ownerAccountId,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: "add_request",
                args: {
                  request: {
                    receiver_id: selectedWallet.walletDetails.walletAddress,
                    actions: [
                      {
                        type: "FunctionCall",
                        method_name: "select_staking_pool",
                        args: btoa(
                          JSON.stringify({ staking_pool_account_id: poolId })
                        ),
                        deposit: "0",
                        gas: "150000000000000",
                      },
                      {
                        type: "FunctionCall",
                        method_name: "deposit_and_stake",
                        args: btoa(JSON.stringify(ftArgs)),
                        deposit: "0",
                        gas: "150000000000000",
                      },
                    ],
                  },
                },
              },
            },
          ],
        });
      } else {
        await w.signAndSendTransaction({
          receiverId: selectedWallet.walletDetails.walletAddress,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: "add_request",
                args: {
                  request: {
                    receiver_id: poolId,
                    actions: [
                      {
                        type: "FunctionCall",
                        method_name: "deposit_and_stake",
                        args: btoa(JSON.stringify({})),
                        deposit: parseNearAmount(amount),
                        gas: "200000000000000",
                      },
                    ],
                  },
                },
              },
            },
          ],
        });
      }
    } catch (e) {
      toast.error(e.message);
      console.error(e);
    } finally {
      setStakingInProgress((prev) => ({ ...prev, [poolId]: false }));
    }
  };

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

          isLockup: false,
          ownerAccountId: data[0].walletAddress,
        });
        setAllWallets([]);
        const allWallets: WalletPretty[] = [];
        for (const wallet of data) {
          allWallets.push({
            prettyName: wallet.walletAddress,
            walletDetails: wallet,
            isLockup: false,
            ownerAccountId: undefined,
          });
          try {
            const lockupValue = calculateLockup(
              wallet.walletAddress,
              "lockup.near"
            );
            const nearConn = await newNearConnection();
            await (await nearConn.account(lockupValue)).state();
            allWallets.push({
              prettyName: `${wallet.walletAddress} (lockup)`,
              walletDetails: {
                walletAddress: lockupValue,
                teamId: wallet.teamId,
                id: lockupValue,
              },
              isLockup: true,
              ownerAccountId: wallet.walletAddress,
            });
          } catch (_) {}
        }
        setAllWallets(allWallets);
      },
    }
  );

  const { data: selectedPool, isLoading: selectedPoolLoading } = useQuery(
    ["isPoolSelected", selectedWallet],
    async () => {
      if (!selectedWallet || !selectedWallet.isLockup) {
        return "";
      }
      const n = await newNearConnection();

      const c = initLockupContract(
        await n.account(""),
        selectedWallet.walletDetails.walletAddress
      );

      const accId = await c.get_staking_pool_account_id();
      console.log(accId);

      return accId;
    }
  );

  const { data: currentBalance, isLoading: balanceLoading } = useQuery(
    ["currentBalance", selectedWallet],
    async () => {
      if (!selectedWallet) {
        return "";
      }

      const n = await newNearConnection();
      const acc = await n.account(selectedWallet.walletDetails.walletAddress);
      return (await acc.state()).amount;
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
        <div className="my-3">
          <div>NEAR Balance</div>
          <div>
            {`${formatNearAmount(currentBalance || "0", 5)} Ⓝ`}
            {balanceLoading}
          </div>
        </div>
        {selectedPool === "" ? (
          <>
            <div className="mb-3 w-full">
              <label className="block text-gray-700">Amount</label>
              <input
                className="mt-2 w-full rounded-lg border px-4 py-2 text-gray-700 focus:outline-none"
                type="text"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <AllAvailablePools
                onStakeClick={addRequestStakeToPool}
                stakingInProgress={stakingInProgress}
              />
            </div>
          </>
        ) : (
          "This lockup already staked to a pool"
        )}
      </div>
    </div>
  );
};

Stake.getLayout = getSidebarLayout;
export default Stake;
