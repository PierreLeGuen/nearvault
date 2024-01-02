import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { parseNearAmount } from "near-api-js/lib/utils/format";
import { toast } from "react-toastify";
import { StakedPool, WalletData } from "~/components/Staking/AllStaked";
import { getSelectedPool } from "~/lib/client";
import { initStakingContract } from "~/lib/staking/contract";
import { WalletPretty } from "~/pages/staking/stake";
import usePersistingStore from "~/store/useStore";
import { useTeamsWalletsWithLockups } from "./teams";
import { useStoreActions } from "easy-peasy";

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
    return await ((await res.json()) as Promise<PoolId[]>);
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
  const canSignTx = useStoreActions((store: any) => store.accounts.canSignTx);
  const signAndSendTransaction = useStoreActions(
    (actions: any) => actions.wallets.signAndSendTransaction,
  );
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
        if (!canSignTx(fromAddress)) return;

        if (selectedWallet.isLockup) {
          if (!selectedWallet.ownerAccountId) {
            throw new Error("No owner account id");
          }

          // selectStakingPoolAction will be empty if the user already has a staking pool selected
          let action: any[];
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

          await signAndSendTransaction({
            senderId: selectedWallet.ownerAccountId,
            receiverId: selectedWallet.ownerAccountId,
            action: {
              type: "FunctionCall",
              method: "add_request",
              args: {
                request: {
                  receiver_id: selectedWallet.walletDetails.walletAddress,
                  actions: action,
                },
              },
              tGas: 300,
            },
          });
        } else {
          await signAndSendTransaction({
            senderId: selectedWallet.walletDetails.walletAddress,
            receiverId: selectedWallet.walletDetails.walletAddress,
            action: {
              type: "FunctionCall",
              method: "add_request",
              args: {
                request: {
                  receiver_id: poolId,
                  actions: [
                    {
                      type: "FunctionCall",
                      method_name: "deposit_and_stake",
                      args: btoa(JSON.stringify({})),
                      deposit: parseNearAmount(amountDivisible.toString()),
                      gas: "200000000000000",
                    },
                  ],
                },
              },
              tGas: 300,
            },
          });
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

export function useGetStakingDetailsForWallets() {
  const { newNearConnection } = usePersistingStore();
  const listWallets = useTeamsWalletsWithLockups();

  return useQuery<WalletData[], Error>(
    ["allStakedPools", listWallets.data],
    async (): Promise<WalletData[]> => {
      const promises = listWallets.data.map(async (wallet) => {
        try {
          const res = await fetch(
            `https://api.kitwallet.app/staking-deposits/${wallet.walletDetails.walletAddress}`,
          );
          const data = (await res.json()) as StakedPool[];
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

            const unstaked_balance = await c.get_account_unstaked_balance({
              account_id: wallet.walletDetails.walletAddress,
            });

            if (total_balance === "0" && unstaked_balance === "0") {
              continue;
            }

            const canWithdraw = await c.is_account_unstaked_balance_available({
              account_id: wallet.walletDetails.walletAddress,
            });

            stakedPools.push({
              deposit: total_balance,
              validator_id: pool.validator_id,
              withdraw_available: canWithdraw ? unstaked_balance : "0",
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
    { enabled: !!listWallets.data },
  );
}

export function useUnstakeTransaction() {
  const canSignTx = useStoreActions((store: any) => store.accounts.canSignTx);
  const signAndSendTransaction = useStoreActions(
    (actions: any) => actions.wallets.signAndSendTransaction,
  );

  return useMutation({
    mutationFn: async ({
      wallet,
      poolId,
      amountNear,
    }: {
      wallet: WalletPretty;
      poolId: string;
      amountNear: string;
    }) => {
      const multisigWallet =
        wallet.ownerAccountId ?? wallet.walletDetails.walletAddress;

      if (!canSignTx(multisigWallet)) return;

      let requestReceiver = poolId;
      // If the staking was done through the lockup contract, then the request
      // should be sent to the lockup contract
      if (wallet.isLockup) {
        requestReceiver = wallet.walletDetails.walletAddress;
      }

      await signAndSendTransaction({
        senderId: multisigWallet,
        receiverId: multisigWallet,
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
                  args: btoa(
                    JSON.stringify({
                      amount: parseNearAmount(amountNear),
                    }),
                  ),
                  deposit: parseNearAmount("0"),
                  gas: "200000000000000",
                },
              ],
            },
          },
          tGas: 300,
        },
      });
    },
  });
}

export function useWithdrawTransaction() {
  const canSignTx = useStoreActions((store: any) => store.accounts.canSignTx);
  const signAndSendTransaction = useStoreActions(
    (actions: any) => actions.wallets.signAndSendTransaction,
  );

  return useMutation({
    mutationFn: async ({
      wallet,
      poolId,
      amountNear,
      maxAmountYocto,
    }: {
      wallet: WalletPretty;
      poolId: string;
      amountNear: string;
      maxAmountYocto: string;
    }) => {
      const multisigWallet =
        wallet.ownerAccountId ?? wallet.walletDetails.walletAddress;

      if (!canSignTx(multisigWallet)) return;

      const yoctoAmount = parseNearAmount(amountNear);
      let requestReceiver = poolId;
      let methodName = "withdraw";
      let deselectAction = undefined;
      // If the staking was done through the lockup contract, then the request
      // should be sent to the lockup contract
      if (wallet.isLockup) {
        requestReceiver = wallet.walletDetails.walletAddress;
        methodName = "withdraw_from_staking_pool";

        if (yoctoAmount === maxAmountYocto) {
          deselectAction = {
            type: "FunctionCall",
            method_name: "unselect_staking_pool",
            args: btoa(JSON.stringify({})),
            deposit: parseNearAmount("0"),
            gas: "150000000000000",
          };
        }
      }

      await signAndSendTransaction({
        senderId: multisigWallet,
        receiverId: multisigWallet,
        action: {
          type: "FunctionCall",
          method: "add_request",
          args: {
            request: {
              receiver_id: requestReceiver,
              actions: [
                {
                  type: "FunctionCall",
                  method_name: methodName,
                  args: btoa(JSON.stringify({ amount: yoctoAmount })),
                  deposit: parseNearAmount("0"),
                  gas: "150000000000000",
                },
              ].concat(deselectAction ? [deselectAction] : []),
            },
          },
          tGas: 300,
        },
      });
    },
  });
}
