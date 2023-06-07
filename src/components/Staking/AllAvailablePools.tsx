import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { initStakingContract } from "~/lib/staking/contract";
import usePersistingStore from "~/store/useStore";

type PoolId = string;
type Percentage = number;

type Pool = {
  id: PoolId;
  status: "active" | "inactive";
  fees: Percentage;
};

const AllAvailablePools = ({
  onStakeClick,
}: {
  onStakeClick: (poolId: string) => Promise<void>;
}) => {
  const { newNearConnection } = usePersistingStore();

  const [pools, setPools] = useState<Map<PoolId, Pool>>(new Map());
  const [searchInput, setSearchInput] = useState<string>("");

  const { isLoading, isError } = useQuery(
    ["allAvailablePools"],
    async () => {
      const res = await fetch("https://api.kitwallet.app/stakingPools");
      const data = await (res.json() as Promise<PoolId[]>);
      return data;
    },
    {
      async onSuccess(poolsFromApi) {
        const activePools: Map<PoolId, Pool> = new Map();
        const inactivePools: Map<PoolId, Pool> = new Map();

        const n = await newNearConnection();
        const validatorsRes = await n.connection.provider.validators(null);

        // Create a Set for constant time lookups
        const validatorSet = new Set(
          validatorsRes.current_validators.map(
            (validator) => validator.account_id
          )
        );

        // Parallelize calls to get_reward_fee_fraction
        const poolPromises = poolsFromApi.map(async (pool) => {
          const contract = initStakingContract(await n.account(""), pool);
          const fees = await contract.get_reward_fee_fraction();

          if (validatorSet.has(pool)) {
            activePools.set(pool, {
              id: pool,
              status: "active",
              fees: Number(
                ((fees.numerator / fees.denominator) * 100).toFixed(2)
              ),
            });
          } else {
            inactivePools.set(pool, {
              id: pool,
              status: "inactive",
              fees: Number(
                ((fees.numerator / fees.denominator) * 100).toFixed(2)
              ),
            });
          }
        });

        // Wait for all promises to resolve
        await Promise.all(poolPromises);

        const sortedPools: Map<PoolId, Pool> = new Map([
          ...activePools,
          ...inactivePools,
        ]);

        setPools(sortedPools);
      },
    }
  );

  const filteredPools = [...pools.values()].filter(
    (
      pool // added filtering based on input
    ) => pool.id.toLowerCase().includes(searchInput.toLowerCase())
  );

  if (isLoading || pools.size === 0) return <div>Loading...</div>;
  if (isError) return <div>Error occurred while fetching pools</div>;
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
                className="rounded-md bg-blue-600 px-4 py-2 text-white"
                onClick={() => {
                  void onStakeClick(pool.id);
                }}
              >
                Stake
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

export default AllAvailablePools;
