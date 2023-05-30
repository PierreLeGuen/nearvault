import { useQuery } from "@tanstack/react-query";
import {
  formatNearAmount,
  parseNearAmount,
} from "near-api-js/lib/utils/format";
import { useState } from "react";
import { initStakingContract } from "~/lib/staking/contract";
import { WalletPretty } from "~/pages/staking/stake";
import usePersistingStore from "~/store/useStore";

interface StakedPool {
  deposit: string;
  validator_id: string;
}

interface WalletData {
  wallet: WalletPretty;
  stakedPools: StakedPool[];
}

const AllStaked = ({ wallets }: { wallets: WalletPretty[] }) => {
  const { currentTeam } = usePersistingStore();
  const { newNearConnection } = usePersistingStore();

  const { isLoading, isError, data } = useQuery<WalletData[], Error>(
    ["allStakedPools", currentTeam?.id || "", wallets],
    async (): Promise<WalletData[]> => {
      console.log(wallets);

      // Ensures a Promise<WalletData[]> is always returned
      const promises = wallets.map(async (wallet) => {
        try {
          const res = await fetch(
            `https://api.kitwallet.app/staking-deposits/${wallet.walletDetails.walletAddress}`
          );
          const data = (await res.json()) as StakedPool[];
          const n = await newNearConnection();
          const stakedPools = [];

          for (const pool of data) {
            // console.log(pool);
            const c = initStakingContract(
              await n.account(""),
              pool.validator_id
            );
            const s = await c.get_account_total_balance({
              account_id: wallet.walletDetails.walletAddress,
            });
            // console.log(s);

            stakedPools.push({
              deposit: s,
              validator_id: pool.validator_id,
            });
          }

          if (stakedPools.length > 0) {
            return {
              wallet,
              stakedPools,
            };
          } else {
            // console.log("No staked pools found for wallet", wallet);
          }
        } catch (e) {
          console.error(e);
        }
      });
      const p = await Promise.all(promises);
      return p.filter((walletData) => walletData !== undefined) as WalletData[];
    },
    {
      onSuccess(poolsFromApi) {
        // console.log("onSuccess");
        // console.log(poolsFromApi);
      },
    }
  );

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
      {`wallets: ${JSON.stringify(wallets)}`}

      {`data: ${JSON.stringify(data)}`}
      {dataFiltered.map((walletData) => (
        <div key={walletData.wallet.walletDetails.id}>
          <h2>{walletData.wallet.prettyName}</h2>
          <div className="flex flex-col rounded-md border bg-white p-4 shadow">
            {walletData.stakedPools.map((pool) => (
              <StakedPoolComponent key={pool.validator_id} pool={pool} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllStaked;

const StakedPoolComponent = ({ pool }: { pool: StakedPool }) => {
  const [amountToUnstake, setAmountToUnstake] = useState("");
  const maxAmount = pool.deposit;

  // check if input amount is greater than the maximum amount
  const isAmountTooHigh = amountToUnstake !== "" && amountToUnstake > maxAmount;

  const inputDivClasses =
    "flex flex-row items-stretch overflow-hidden rounded-md shadow " +
    (isAmountTooHigh ? "bg-red-200" : "bg-gray-200");

  const buttonClasses =
    "px-4 py-2 text-white " + (isAmountTooHigh ? "bg-red-500" : "bg-blue-500");

  return (
    <div key={pool.validator_id}>
      <div>
        <a
          href={"https://near-staking.com/validator/" + pool.validator_id}
          target="_blank"
        >
          {pool.validator_id}
        </a>
        <div className="flex flex-row justify-between">
          <div>{formatNearAmount(pool.deposit) + " Ⓝ"}</div>
          <button onClick={() => setAmountToUnstake(pool.deposit)}>
            Use max
          </button>
        </div>
        <div className={inputDivClasses}>
          <input
            className="flex-grow rounded-l-md px-2 py-2 focus:outline-none"
            type="text"
            placeholder="Enter amount..."
            value={
              amountToUnstake !== "" ? formatNearAmount(amountToUnstake) : ""
            }
            onChange={(e) =>
              setAmountToUnstake(parseNearAmount(e.target.value) || "")
            }
          />
          <button className={buttonClasses} disabled={isAmountTooHigh}>
            Unstake
          </button>
        </div>
      </div>
    </div>
  );
};
