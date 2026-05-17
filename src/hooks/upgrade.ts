import { type Wallet } from "@prisma/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { BN } from "bn.js";
import { transactions } from "near-api-js";
import {
  classifyWalletHash,
  checkExistingUpgradeProposals,
  fetchMultisigWasmBase64,
  getAccountCodeHash,
  VULNERABLE_MULTISIG_HASH,
  type UpgradeEligibility,
} from "~/lib/multisig/upgrade";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import usePersistingStore from "~/store/useStore";
import { addMultisigRequestAction } from "./manage";
import { TGas } from "./staking";
import { useListWallets } from "./teams";

export type WalletUpgradeInfo = {
  wallet: Wallet;
  codeHash: string | null;
  eligibility: UpgradeEligibility;
  existingProposals: { id: number; isVerifiedUpgrade: boolean }[];
  canSign: boolean;
  error?: string;
};

type WalletOnChainStatus = {
  wallet: Wallet;
  codeHash: string | null;
  eligibility: UpgradeEligibility;
  existingProposals: { id: number; isVerifiedUpgrade: boolean }[];
  error?: string;
};

export function useWalletsUpgradeStatus() {
  const walletsQuery = useListWallets();
  const { rpcUrl } = usePersistingStore();
  const wsStore = useWalletTerminator();

  const onChainQuery = useQuery({
    queryKey: ["walletsUpgradeStatus", walletsQuery.data, rpcUrl],
    enabled: !!walletsQuery.data,
    queryFn: async (): Promise<WalletOnChainStatus[]> => {
      const wallets = walletsQuery.data ?? [];
      const results = await Promise.all(
        wallets.map(async (wallet): Promise<WalletOnChainStatus> => {
          try {
            const codeHash = await getAccountCodeHash(
              wallet.walletAddress,
              rpcUrl,
            );

            if (!codeHash) {
              return {
                wallet,
                codeHash: null,
                eligibility: "ineligible",
                existingProposals: [],
              };
            }

            const eligibility = classifyWalletHash(codeHash);

            let existingProposals: {
              id: number;
              isVerifiedUpgrade: boolean;
            }[] = [];
            if (eligibility === "eligible") {
              existingProposals = await checkExistingUpgradeProposals(
                wallet.walletAddress,
                rpcUrl,
              );
            }

            return {
              wallet,
              codeHash,
              eligibility,
              existingProposals,
            };
          } catch (e) {
            return {
              wallet,
              codeHash: null,
              eligibility: "ineligible",
              existingProposals: [],
              error: (e as Error).message || "Failed to check wallet status",
            };
          }
        }),
      );

      return results.sort((a, b) => {
        const order: Record<UpgradeEligibility, number> = {
          eligible: 0,
          "already-upgraded": 1,
          ineligible: 2,
        };
        return order[a.eligibility] - order[b.eligibility];
      });
    },
  });

  const keysSnapshot = JSON.stringify(wsStore.keysToAccounts);

  const data = useMemo((): WalletUpgradeInfo[] | undefined => {
    if (!onChainQuery.data) return undefined;
    return onChainQuery.data.map((status) => ({
      ...status,
      canSign:
        wsStore.getPublicKeysForAccount(status.wallet.walletAddress).length > 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChainQuery.data, keysSnapshot]);

  return {
    ...onChainQuery,
    data,
  };
}

export function useUpgradeContract() {
  const wsStore = useWalletTerminator();
  const { rpcUrl } = usePersistingStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      walletAddress,
    }: {
      walletAddress: string;
    }) => {
      const signerKeys = wsStore.getPublicKeysForAccount(walletAddress);
      if (signerKeys.length === 0) {
        throw new Error(
          `No connected signer for ${walletAddress}. Connect a key before creating the proposal.`,
        );
      }

      const { base64 } = await fetchMultisigWasmBase64();

      const currentHash = await getAccountCodeHash(walletAddress, rpcUrl);
      if (currentHash !== VULNERABLE_MULTISIG_HASH) {
        throw new Error(
          `Wallet ${walletAddress} code hash is ${currentHash ?? "unknown"}, expected ${VULNERABLE_MULTISIG_HASH}. Aborting.`,
        );
      }

      const existingProposals = await checkExistingUpgradeProposals(
        walletAddress,
        rpcUrl,
        { strict: true },
      );
      if (existingProposals.length > 0) {
        throw new Error(
          `A deploy-contract proposal already exists on ${walletAddress} (request id: ${existingProposals[0]!.id}). Approve or delete it before creating a new one.`,
        );
      }

      const action = transactions.functionCall(
        "add_request",
        addMultisigRequestAction(walletAddress, [
          {
            type: "DeployContract",
            code: base64,
          },
        ]),
        new BN(300 * TGas),
        new BN("0"),
      );

      await wsStore.signAndSendTransaction({
        senderId: walletAddress,
        receiverId: walletAddress,
        actions: [action],
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["walletsUpgradeStatus"],
      });
    },
  });
}
