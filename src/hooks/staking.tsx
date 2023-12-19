import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { toast } from "react-toastify";
import { handleWalletRequestWithToast } from "~/components/toast-request-result";
import { useWalletSelector } from "~/context/wallet";
import { getSelectedPool } from "~/lib/client";
import { initStakingContract } from "~/lib/staking/contract";
import { assertCorrectMultisigWallet } from "~/lib/utils";
import { WalletPretty } from "~/pages/staking/stake";
import usePersistingStore from "~/store/useStore";

export type PoolId = string;
export type Percentage = number;

export type Pool = {
  id: PoolId;
  status: "active" | "inactive";
  fees: Percentage;
};

export function useIsPoolSelected(selectedWallet: WalletPretty | undefined) {
  const { newNearConnection } = usePersistingStore();

  return useQuery(["isPoolSelected", selectedWallet], async () => {
    if (!selectedWallet || !selectedWallet.isLockup) {
      return "";
    }
    return await getSelectedPool(
      "",
      selectedWallet.walletDetails.walletAddress,
      await newNearConnection(),
    );
  });
}

export function useListAllStakingPools() {
  return useQuery(["allAvailablePools"], async () => {
    const res = await fetch("https://api.kitwallet.app/stakingPools");
    const data = await (res.json() as Promise<PoolId[]>);
    return data;
  });
}

export function useListAllStakingPoolsWithDetails() {
  const { data } = useListAllStakingPools();
  const { newNearConnection } = usePersistingStore();

  return useQuery({
    queryKey: ["listAllWithDetails", data],
    enabled: !!data,
    queryFn: async () => {
      const activePools: Map<PoolId, Pool> = new Map();
      const inactivePools: Map<PoolId, Pool> = new Map();

      const n = await newNearConnection();
      const validatorsRes = await n.connection.provider.validators(null);

      // Create a Set for constant time lookups
      const validatorSet = new Set(
        validatorsRes.current_validators.map(
          (validator) => validator.account_id,
        ),
      );

      // Parallelize calls to get_reward_fee_fraction
      const poolPromises = data.map(async (pool) => {
        const contract = initStakingContract(await n.account(""), pool);
        const fees = await contract.get_reward_fee_fraction();

        if (validatorSet.has(pool)) {
          activePools.set(pool, {
            id: pool,
            status: "active",
            fees: Number(
              ((fees.numerator / fees.denominator) * 100).toFixed(2),
            ),
          });
        } else {
          inactivePools.set(pool, {
            id: pool,
            status: "inactive",
            fees: Number(
              ((fees.numerator / fees.denominator) * 100).toFixed(2),
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

      return sortedPools;
    },
  });
}

export function useAddRequestStakeToPool() {
  const walletSelector = useWalletSelector();
  const { newNearConnection } = usePersistingStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      selectedWallet,
      poolId,
      amountNear: amountDivisible,
    }: {
      selectedWallet: WalletPretty;
      poolId: string;
      amountNear: number;
    }) => {
      const accId = await getSelectedPool(
        "",
        selectedWallet.walletDetails.walletAddress,
        await newNearConnection(),
      );
      console.log(selectedWallet);
      console.log(accId);

      try {
        let fromAddress = selectedWallet.walletDetails.walletAddress;

        if (selectedWallet.isLockup) {
          if (!selectedWallet.ownerAccountId) {
            throw new Error("No owner account id");
          }
          fromAddress = selectedWallet.ownerAccountId;
        }
        await assertCorrectMultisigWallet(walletSelector, fromAddress);
        const w = await walletSelector.selector.wallet();

        if (selectedWallet.isLockup) {
          if (!selectedWallet.ownerAccountId) {
            throw new Error("No owner account id");
          }

          // selectStakingPoolAction will be empty if the user already has a staking pool selected
          let action = [];
          if (accId) {
            const ftArgs = {
              amount: parseNearAmount(amountDivisible.toString()),
            };

            action = [
              {
                type: "FunctionCall",
                method_name: "deposit_and_stake",
                args: btoa(JSON.stringify(ftArgs)),
                deposit: "0",
                gas: "150000000000000",
              },
            ];
          } else {
            toast.info(
              "You need to first select the staking pool with the following transaction then come back again here to deposit and stake.",
            );
            action = [
              {
                type: "FunctionCall",
                method_name: "select_staking_pool",
                args: btoa(JSON.stringify({ staking_pool_account_id: poolId })),
                deposit: "0",
                gas: "150000000000000",
              },
            ];
          }

          await handleWalletRequestWithToast(
            w.signAndSendTransaction({
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
                        actions: action,
                      },
                    },
                  },
                },
              ],
            }),
          );
        } else {
          await handleWalletRequestWithToast(
            w.signAndSendTransaction({
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
                            deposit: parseNearAmount(
                              amountDivisible.toString(),
                            ),
                            gas: "200000000000000",
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            }),
          );
        }
      } catch (e) {
        toast.error((e as Error).message);
        console.error(e);
      }
    },
    onSuccess: async (_, params) => {
      await queryClient.invalidateQueries({
        queryKey: ["isPoolSelected", params.selectedWallet],
      });
    },
  });
}
