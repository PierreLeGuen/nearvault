import { useQuery } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { calculateLockup } from "~/lib/lockup/lockup";
import { initStakingContract } from "~/lib/staking/contract";
import { type WalletPretty } from "~/pages/staking/stake";
import usePersistingStore from "~/store/useStore";
import StakedPoolComponent from "./StakedPoolComponent";
import { useStoreActions } from "easy-peasy";
import { config } from "~/config/config";
import { fetchJson } from "~/store-easy-peasy/helpers/fetchJson";

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
  const canSignTx = useStoreActions((store: any) => store.accounts.canSignTx);
  const signAndSendTransaction = useStoreActions(
    (actions: any) => actions.wallets.signAndSendTransaction,
  );
  const { currentTeam, newNearConnection } = usePersistingStore();

  const { isLoading, isError, data } = useQuery<WalletData[], Error>(
    ["allStakedPools", currentTeam?.id || "", wallets],
    async (): Promise<WalletData[]> => {
      const promises = wallets.map(async (wallet) => {
        try {
          const data: StakedPool[] = await fetchJson(
            config.urls.kitWallet.stakingDeposits(
              wallet.walletDetails.walletAddress,
            ),
          );
          const n = await newNearConnection();
          const stakedPools = [];

          for (const pool of data) {
            const c = initStakingContract(
              await n.account(""),
              pool.validator_id,
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
    },
  );

  const sendUnstakeTransaction = async (
    multisigAcc: string,
    isLockup: boolean,
    poolId: string,
    amount: string,
  ) => {
    if (!canSignTx(multisigAcc)) return;

    let requestReceiver = poolId;
    // If the staking was done through the lockup contract, then the request
    // should be sent to the lockup contract
    if (isLockup) {
      requestReceiver = calculateLockup(
        multisigAcc,
        config.accounts.lockupFactory,
      );
    }

    await signAndSendTransaction({
      senderId: multisigAcc,
      receiverId: multisigAcc,
      action: {
        type: "FunctionCall",
        method: "add_request",
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
        tGas: 300,
      },
    });
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
                  config.accounts.lockupFactory,
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
