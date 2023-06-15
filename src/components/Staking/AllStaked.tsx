import { useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { toast } from "react-toastify";
import { useWalletSelector } from "~/context/wallet";
import { calculateLockup } from "~/lib/lockup/lockup";
import { initStakingContract } from "~/lib/staking/contract";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import { type WalletPretty } from "~/pages/staking/stake";
import usePersistingStore from "~/store/useStore";
import StakedPoolComponent from "./StakedPoolComponent";

export interface StakedPool {
  deposit: string;
  withdraw_available: string;
  validator_id: string;
}

export interface WalletData {
  wallet: WalletPretty;
  stakedPools: StakedPool[];
}

const AllStaked = ({ wallets }: { wallets: WalletPretty[] }) => {
  const { currentTeam, newNearConnection } = usePersistingStore();
  const walletSelector = useWalletSelector();

  const { isLoading, isError, data } = useQuery<WalletData[], Error>(
    ["allStakedPools", currentTeam?.id || "", wallets],
    async (): Promise<WalletData[]> => {
      const promises = wallets.map(async (wallet) => {
        try {
          const res = await fetch(
            `https://api.kitwallet.app/staking-deposits/${wallet.walletDetails.walletAddress}`
          );
          const data = (await res.json()) as StakedPool[];
          const n = await newNearConnection();
          const stakedPools = [];

          for (const pool of data) {
            const c = initStakingContract(
              await n.account(""),
              pool.validator_id
            );
            const total_balance = await c.get_account_staked_balance({
              account_id: wallet.walletDetails.walletAddress,
            });
            if (total_balance === "0") {
              continue;
            }

            stakedPools.push({
              deposit: total_balance,
              validator_id: pool.validator_id,
            });
          }

          if (stakedPools.length > 0) {
            return {
              wallet,
              stakedPools,
            };
          } else {
            console.log("No staked pools found for wallet", wallet);
          }
        } catch (e) {
          console.error(e);
        }
      });
      const p = await Promise.all(promises);
      return p.filter((walletData) => walletData !== undefined) as WalletData[];
    }
  );

  const sendUnstakeTransaction = async (
    multisigAcc: string,
    isLockup: boolean,
    poolId: string,
    amount: string
  ) => {
    try {
      await assertCorrectMultisigWallet(walletSelector, multisigAcc);
    } catch (e) {
      toast.error((e as Error).message);
      return;
    }
    const w = await walletSelector.selector.wallet();
    if (!w) {
      throw new Error("No wallet selected");
    }

    let requestReceiver = poolId;
    // If the staking was done through the lockup contract, then the request
    // should be sent to the lockup contract
    if (isLockup) {
      requestReceiver = calculateLockup(multisigAcc, "lockup.near");
    }

    const res = await w.signAndSendTransaction({
      receiverId: multisigAcc,
      actions: [
        {
          type: "FunctionCall",
          params: {
            gas: "300000000000000",
            deposit: "0",
            methodName: "add_request",
            args: {
              request: {
                receiver_id: requestReceiver,
                actions: [
                  {
                    type: "FunctionCall",
                    method_name: "unstake",
                    args: btoa(JSON.stringify({ amount: amount })),
                    deposit: parseNearAmount("0"),
                    gas: "200000000000000",
                  },
                ],
              },
            },
          },
        },
      ],
    });

    console.log(res);
  };

  if (isLoading || !data) {
    return <div>Loading pools...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }

  const dataFiltered =
    data?.filter((walletData) => walletData.stakedPools.length > 0) || [];

  return (
    <div className="flex flex-col">
      {dataFiltered.map((walletData) => (
        <div key={walletData.wallet.walletDetails.id}>
          <h2>{walletData.wallet.prettyName}</h2>
          <div className="flex flex-col rounded-md border bg-white p-4 shadow">
            {walletData.stakedPools.map((pool) => (
              <StakedPoolComponent
                key={pool.validator_id}
                pool={pool}
                wallet={walletData}
                unstakeFn={sendUnstakeTransaction}
                isLockup={walletData.wallet.walletDetails.walletAddress.includes(
                  "lockup.near"
                )}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllStaked;
