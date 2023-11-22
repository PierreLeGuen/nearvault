import { type Wallet } from "@prisma/client";
import * as naj from "near-api-js";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import { useWalletSelector } from "~/context/wallet";
import { api } from "~/lib/api";
import {
  MultiSigRequestActionType,
  initMultiSigContract,
  type MultisigRequest,
} from "~/lib/multisig/contract";
import { assertCorrectMultisigWallet as assertCanSignForMultisigWallet } from "~/lib/utils";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { DataTable } from "./data-table";
import { columns } from "./lib/columns";
import { RequestRow, explainAction } from "./lib/explain";

type ApproveOrReject = "approve" | "reject";

const PendingRequests: NextPageWithLayout = () => {
  useSession({ required: true });
  const wallet = useWalletSelector();

  const { currentTeam, publicKey, newNearConnection } = usePersistingStore();
  const [requests, setRequests] = useState<Map<Wallet, Array<RequestRow>>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState(new Map());
  if (!currentTeam) {
    throw new Error("No current team");
  }

  const wallets =
    api.teams.getWalletsForTeam.useQuery({ teamId: currentTeam.id }).data ??
    null;

  const approveOrRejectRequest = async (
    multisig_wallet: Wallet,
    request: MultisigRequest,
    kind: ApproveOrReject,
  ) => {
    // if (!request.request_id) {
    //   throw new Error("No request id");
    // }

    try {
      setLoadingState((prev) => new Map(prev.set(request.request_id, kind)));

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
                  request_id: request.request_id,
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

      if (kind === "reject") {
        const updatedRequests = new Map(pendingRequests);
        const walletRequests = updatedRequests.get(multisig_wallet);
        const remainingRequests = walletRequests!.filter(
          (r) => r.request_id !== request.request_id,
        );
        updatedRequests.set(multisig_wallet, remainingRequests);

        setPendingRequests(updatedRequests);
      }
      if (kind === "approve") {
        const updatedRequests = new Map(pendingRequests);
        const walletRequests = updatedRequests.get(multisig_wallet);
        const remainingRequests = walletRequests!.filter((r) => {
          if (r.request_id !== request.request_id) {
            return true;
          }
          if (publicKey) {
            request.confirmations.push(publicKey.toString());
          }
          if (
            request.confirmations.length + 1 >=
            request.requiredConfirmations
          ) {
            return false;
          }
          return true;
        });
        updatedRequests.set(multisig_wallet, remainingRequests);
        setPendingRequests(updatedRequests);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoadingState((prev) => new Map(prev.set(request.request_id, "idle")));
    }
  };

  useEffect(() => {
    const connectionConfig = {
      networkId: "mainnet",
      keyStore: new naj.keyStores.BrowserLocalStorageKeyStore(),
      nodeUrl: "https://rpc.mainnet.near.org",
      walletUrl: "https://wallet.mainnet.near.org",
      helperUrl: "https://helper.mainnet.near.org",
      explorerUrl: "https://explorer.mainnet.near.org",
    };

    const fetchPendingRequests = async () => {
      setLoading(true);

      if (!wallets) {
        return;
      }
      console.log(wallets);

      const tempPendingRequests = new Map();

      for (const wallet of wallets) {
        try {
          const nearConnection = await naj.connect(connectionConfig);
          const walletConnection = new naj.WalletConnection(nearConnection, "");
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
                actual_receiver: "",
                explanation: explanation!,
              });
            }
          }

          tempPendingRequests.set(wallet, l);
        } catch (e) {
          console.log(e);
        }
      }
      console.log(tempPendingRequests);

      setRequests(tempPendingRequests);
      setLoading(false);
    };

    if (wallets) {
      fetchPendingRequests().catch(console.error);
    }
  }, [wallets, newNearConnection]);

  const alreadyApproved = (confirmations: string[], publicKey: string) => {
    return confirmations.some((c) => c === publicKey);
  };

  return (
    <div>
      <h1>Pending requests</h1>
      {loading && <p>Loading...</p>}
      {!loading && requests.size === 0 && <p>No pending requests.</p>}
      {Array.from(requests).map(([wallet, _requests]) =>
        _requests.length === 0 ? null : (
          <div key={wallet.id} className="mb-2 border-gray-200 p-2">
            <h2 className="text-md mb-1 font-bold">
              Wallet ID: {wallet.walletAddress}
            </h2>
            <h3 className="mb-1 text-sm font-bold">Requests:</h3>
            <div>
              <DataTable columns={columns} data={_requests} />
            </div>
          </div>
        ),
      )}
    </div>
  );
};

PendingRequests.getLayout = getSidebarLayout;
export default PendingRequests;
