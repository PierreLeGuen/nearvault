import { type Wallet } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { config } from "~/config/config";
import { viewAccessKeyList } from "~/lib/client";
import {
  type RequestRow,
  explainAction,
  type explanation,
} from "~/lib/explain-transaction";
import {
  MultiSigRequestActionType,
  initMultiSigContract,
} from "~/lib/multisig/contract";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import usePersistingStore from "~/store/useStore";
import { RateLimiter } from "~/utils/rate-limiter";
import { useListWallets } from "./teams";

export const useGetMultisigRequestRowsForTeam = () => {
  const { newNearConnection, rpcUrl } = usePersistingStore();
  const walletsQuery = useListWallets();

  return useQuery({
    queryKey: ["multisigRequestRowsForTeam", walletsQuery.data],
    enabled: !!walletsQuery.data,
    queryFn: async () => {
      const rows: Map<Wallet, RequestRow[]> = new Map();
      let rateLimiter: RateLimiter;
      if (rpcUrl === config.urls.rpc) {
        rateLimiter = new RateLimiter(1);
      } else {
        rateLimiter = new RateLimiter(100);
      }

      await Promise.all(
        walletsQuery.data.map(async (wallet) => {
          await rateLimiter.acquire();
          const near = await newNearConnection();
          const multisig = initMultiSigContract(
            await near.account(wallet.walletAddress),
          );

          let requestIds: number[];
          try {
            requestIds = await multisig.list_request_ids();
          } catch (e) {
            console.error("must not be mutlsig wallet", e);
            return;
          }

          const numConfirmations = await multisig.get_num_confirmations();
          requestIds.sort((a, b) => Number(b) - Number(a));

          const list: RequestRow[] = await Promise.all(
            requestIds.map(async (requestId) => {
              const [request, confirmations] = await Promise.all([
                multisig.get_request({ request_id: requestId }),
                multisig.get_confirmations({ request_id: requestId }),
              ]);

              const processedRequest = {
                ...request,
                request_id: Number(requestId),
                confirmations: confirmations,
                requiredConfirmations: numConfirmations,
                actions: request.actions.map((action) => {
                  if (action.type === MultiSigRequestActionType.FunctionCall) {
                    let args = action.args;
                    try {
                      args = JSON.parse(
                        Buffer.from(action.args, "base64").toString("utf8"),
                      ) as string;
                    } catch (e) {
                      console.log(e);
                    }
                    return {
                      ...action,
                      args,
                    };
                  }
                  return action;
                }),
              };

              const explanations = await Promise.all(
                processedRequest.actions.map(async (action, index) => {
                  try {
                    return await explainAction(
                      action,
                      processedRequest.receiver_id,
                      wallet.walletAddress,
                      newNearConnection,
                    );
                  } catch (e) {
                    console.error(e);
                    return null;
                  }
                }),
              );

              return {
                request: processedRequest,
                actual_receiver:
                  explanations.find((e) => e?.actual_receiver)?.actual_receiver ||
                  processedRequest.receiver_id,
                explanations: explanations.filter((e): e is explanation => e !== null),
              };
            }),
          );

          rows.set(wallet, list);
        }),
      );

      return rows;
    },
  });
};

export function useGetAccountKeys(multisigAccountId: string) {
  const { rpcUrl } = usePersistingStore();
  return useQuery({
    queryKey: ["getAccountKeys", multisigAccountId],
    queryFn: async () => {
      const keys = await viewAccessKeyList(multisigAccountId, rpcUrl);

      return keys;
    },
  });
}

export function useUsableKeysForSigning(
  multisigAccountId: string,
  requestId: number,
) {
  const keysQuery = useGetAccountKeys(multisigAccountId);
  const wsStore = useWalletTerminator();
  const { newNearConnection } = usePersistingStore();

  return useQuery({
    queryKey: ["usableKeysForSigning", keysQuery.data, requestId],
    enabled: !!keysQuery.data,
    queryFn: async () => {
      const near = await newNearConnection();
      const multisig = initMultiSigContract(
        await near.account(multisigAccountId),
      );

      let confirmations: string[] = [];
      try {
        confirmations = await multisig.get_confirmations({
          request_id: requestId,
        });
      } catch (e) {
        console.log("must not be mutlsig wallet", e);
        return [];
      }

      const keysData = keysQuery.data;

      const remainingKeys = keysData.keys.filter((key) => {
        return !confirmations.some(
          (confirmation) => confirmation === key.public_key,
        );
      });

      const myUsableKeys = remainingKeys.filter((key) => {
        return wsStore
          .getPublicKeysForAccount(multisigAccountId)
          .some((importedPk) => importedPk === key.public_key);
      });

      return myUsableKeys;
    },
  });
}
