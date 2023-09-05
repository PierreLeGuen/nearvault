import { useState } from "react";
import { classNames } from "../Sidebar/TeamsMenu";

type PoolId = string;
type Percentage = number;

type Pool = {
  id: PoolId;
  status: "active" | "inactive";
  fees: Percentage;
};

const AllAvailablePools = ({
  onStakeClick,
  stakingInProgress,
  poolsAllowList,
  btnText,
  pools,
}: {
  onStakeClick: (poolId: string) => Promise<void>;
  stakingInProgress: { [poolId: string]: boolean };
  poolsAllowList: string[];
  btnText: "Stake" | "Select Pool";
  pools: Map<PoolId, Pool>;
}) => {
  const [searchInput, setSearchInput] = useState<string>("");

  const filteredPools = [...pools.values()]
    .filter((pool) => pool.id.toLowerCase().includes(searchInput.toLowerCase()))
    .filter((pool) =>
      poolsAllowList.length > 0 ? poolsAllowList.includes(pool.id) : true
    );

  return (
    <>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search pools"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-md border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <div className="mb-4 text-sm">
        More information on pools check{" "}
        <a
          href="https://near-staking.com/"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          NEAR Staking
        </a>
      </div>
      <div className="flex flex-col">
        {filteredPools.map((pool) => (
          <div
            key={pool.id}
            className="m-2 flex items-center justify-between rounded-md border bg-white p-4 shadow"
          >
            <div>
              <a
                className="mb-2 text-lg font-bold text-blue-500 hover:underline"
                href={"https://near-staking.com/validator/" + pool.id}
                target="_blank"
              >
                {pool.id}
              </a>
              <p>
                Status: <span className="font-semibold">{pool.status}</span>
              </p>
              <p>
                Fees: <span className="font-semibold">{pool.fees} %</span>
              </p>
            </div>
            {pool.status === "active" && (
              <button
                className={classNames(
                  "rounded-md bg-blue-600 px-4 py-2 text-white",
                  stakingInProgress[pool.id]
                    ? "cursor-not-allowed opacity-50"
                    : ""
                )}
                disabled={stakingInProgress[pool.id]}
                onClick={() => {
                  void onStakeClick(pool.id);
                }}
              >
                {stakingInProgress[pool.id] ? "Creating request..." : btnText}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default AllAvailablePools;
