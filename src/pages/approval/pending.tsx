import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import {
  MultiSigRequestActionType,
  initMultiSigContract,
} from "~/lib/multisig/contract";
import { assertCorrectMultisigWallet as assertCanSignForMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { explainAction, type RequestRow } from "./lib/explain";
import PendingRequestsTable from "./pendingRequests";

export type ApproveOrReject = "approve" | "reject";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
  const wallet = useWalletSelector();

  const { currentTeam, publicKey, newNearConnection } = usePersistingStore();
  const [requests, setRequests] = useState<Map<Wallet, Array<RequestRow>>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [, setLoadingState] = useState(new Map());
  if (!currentTeam) {
    throw new Error("No current team");
  }

  const wallets =
    api.teams.getWalletsForTeam.useQuery({ teamId: currentTeam.id }).data ??
    null;

  const fetchWalletData = async (wallet: Wallet): Promise<RequestRow[]> => {
    try {
      const n = await newNearConnection();
      const walletConnection = new naj.WalletConnection(n, "");
      const c = initMultiSigContract(
        walletConnection.account(),
        wallet.walletAddress,
      );
      const request_ids = await c.list_request_ids();
      const numConfirmations = await c.get_num_confirmations();

      request_ids.sort((a, b) => Number(b) - Number(a));

      const requestPromises = request_ids.map(async (request_id) => {
        const request = await c.get_request({ request_id: request_id });
        const confirmations = await c.get_confirmations({
          request_id: request_id,
        });

        return {
          ...request,
          request_id: Number(request_id),
          confirmations: confirmations,
          requiredConfirmations: numConfirmations,
          actions: request.actions.map((action) => {
            if (action.type === MultiSigRequestActionType.FunctionCall) {
              let a = action.args;
              try {
                const b = JSON.parse(
                  Buffer.from(action.args, "base64").toString("utf8"),
                ) as string;
                a = b;
              } catch (e) {
                console.log(e);
              }
              return {
                ...action,
                args: a,
              };
            }
            return action;
          }),
        };
      });
      const l: RequestRow[] = [];
      const requests = await Promise.all(requestPromises);
      for (const request of requests) {
        for (let index = 0; index < request.actions.length; index++) {
          const action = request.actions[index];
          const explanation = await explainAction(
            action!,
            request.receiver_id,
            wallet.walletAddress,
            newNearConnection,
          ).catch((e) => {
            console.error(e);
            return undefined;
          });
          l.push({
            request: request,
            actual_receiver:
              explanation?.actual_receiver || request.receiver_id,
            explanation: explanation!,
          });
        }
      }

      return l;
    } catch (e) {
      console.log(e);
      return [];
    }
  };

  const approveOrRejectRequest = async (
    multisig_wallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => {
    try {
      setLoadingState((prev) => new Map(prev.set(requestId, kind)));

      try {
        await assertCanSignForMultisigWallet(
          wallet,
          multisig_wallet.walletAddress,
        );
      } catch (e) {
        toast.error((e as Error).message);
        return;
      }

      wallet.selector.setActiveAccount(multisig_wallet.walletAddress);
      const w = await wallet.selector.wallet();
      await toast.promise(
        w.signAndSendTransaction({
          receiverId: multisig_wallet.walletAddress,
          actions: [
            {
              type: "FunctionCall",
              params: {
                gas: "300000000000000",
                deposit: "0",
                methodName: kind === "approve" ? "confirm" : "delete_request",
                args: {
                  request_id: requestId,
                },
              },
            },
          ],
        }),
        {
          pending: "Check your wallet to approve the request",
          success: {
            render: (data) => {
              if (!data.data) {
                return `Successfully sent request to the multisig wallet`;
              }
              return (
                <span>
                  Successfully sent request to the multisig wallet, transaction
                  id:{" "}
                  <a
                    href={`https://nearblocks.io/txns/${data.data.transaction_outcome.id}`}
                    target="_blank"
                    className="font-bold underline"
                  >
                    {data.data.transaction_outcome.id}
                  </a>
                  `
                </span>
              );
            },
          },
          error: {
            render: (err) => {
              return `Failed to send transaction: ${
                (err.data as Error).message
              }`;
            },
          },
        },
      );

      const updatedRequests = new Map(requests);
      const updatedWalletRequests = await fetchWalletData(multisig_wallet);
      updatedRequests.set(multisig_wallet, updatedWalletRequests);
      setRequests(updatedRequests);
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingState((prev) => new Map(prev.set(requestId, "idle")));
    }
  };

  useEffect(() => {
    const fetchPendingRequests = async () => {
      setLoading(true);

      if (!wallets) {
        return;
      }
      console.log(wallets);

      const walletPromises = wallets.map(async (wallet) => {
        const data = await fetchWalletData(wallet);
        return [wallet, data] as [Wallet, RequestRow[]];
      });
      const results = await Promise.all(walletPromises);

      const tempPendingRequests = new Map();
      results.forEach(([wallet, requestRow]) => {
        tempPendingRequests.set(wallet, requestRow);
      });

      console.log(tempPendingRequests);
      setRequests(tempPendingRequests);
      setLoading(false);
    };

    if (wallets) {
      fetchPendingRequests().catch(console.error);
    }
  }, [wallets, newNearConnection]);

  return (
    <div className="flex flex-col gap-10 px-12 py-10">
      <HeaderTitle level="h1" text="Pending requests" />
      {loading && <p>Loading...</p>}
      {!loading && requests.size === 0 && <p>No pending requests.</p>}
      {!loading &&
        Array.from(requests).map(([wallet, _requests]) =>
          _requests.length === 0 ? null : (
            <div key={wallet.id} className="mb-2 border-gray-200 ">
              <h2 className="text-md mb-1 font-bold">
                Wallet ID: {wallet.walletAddress}
              </h2>
              <div>
                <PendingRequestsTable
                  data={_requests}
                  wallet={wallet}
                  approveRejectFn={approveOrRejectRequest}
                  publicKey={publicKey || undefined}
                />
              </div>
            </div>
          ),
        )}
    </div>
  );
};

PendingRequests.getLayout = getSidebarLayout;
export default PendingRequests;
